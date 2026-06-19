class Player {
    constructor(startX, startY, worldContainer) {
        this.x            = startX;
        this.y            = startY;
        this.isZombie     = false;
        this.facingRight  = true;
        this.isAttacking  = false;
        this.health       = Config.playerMaxHealth;
        this.dead         = false;

        this.container = new PIXI.Container();
        worldContainer.addChild(this.container);

        this._buildVisual();
        this._bulletCooldown = 0;
        this._dashCooldown   = 0;
        this._dashDuration   = 0;
        this._dashVx         = 0;
        this._dashVy         = 0;
        this._pushVx         = 0;
        this._pushVy         = 0;
        this._worldContainer = null;
    }

    // ── Visual ────────────────────────────────────────────────────────────
    _buildVisual() {
        this.container.removeChildren();
        const anims = this.isZombie ? zeroAnimations : playerAnimations;
        this.sprite  = new PIXI.AnimatedSprite(anims.idle);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
        this.container.addChild(new PIXI.Graphics());
    }

    _setAnimation(animName, loop = true) {
        if (!this.sprite) return;
        const anims = this.isZombie ? zeroAnimations : playerAnimations;
        if (this.sprite.textures === anims[animName]) return;
        this.sprite.textures = anims[animName];
        this.sprite.loop     = loop;
        this.sprite.gotoAndPlay(0);
        if (!loop) {
            this.sprite.onComplete = () => {
                this.isAttacking       = false;
                this.sprite.onComplete = null;
            };
        }
    }

    // ── Transformación ────────────────────────────────────────────────────
    becomeZombie(worldContainer, humans, zombies) {
        if (this.isZombie) return;
        this.isZombie = true;
        document.getElementById('hud-left').style.display  = 'flex';
        document.getElementById('hud-right').style.display = 'flex';
        this._buildVisual();
        this._animarAOE(worldContainer);
        for (const h of humans) {
            if (Utils.distance(this.x, this.y, h.x, h.y) < Config.aoeRadius) {
                h.startInfection(worldContainer, zombies);
            }
        }
    }

    _animarAOE(worldContainer) {
        const ring = new PIXI.Graphics();
        worldContainer.addChild(ring);
        const px = this.x, py = this.y;
        let frame = 0;
        const animar = () => {
            frame++;
            const progress = frame / Config.aoeFadeFrames;
            const alpha    = 1 - progress;
            const radius   = Config.aoeRadius * progress;
            ring.clear();
            ring.lineStyle(4, 0xf8ff00, alpha * 0.4);
            ring.drawCircle(px, py, radius + 6);
            ring.lineStyle(2.5, 0xf8ff00, alpha);
            ring.beginFill(0xf8ff00, alpha * 0.15);
            ring.drawCircle(px, py, radius);
            ring.endFill();
            if (frame < Config.aoeFadeFrames) requestAnimationFrame(animar);
            else { ring.clear(); worldContainer.removeChild(ring); }
        };
        requestAnimationFrame(animar);
    }

    // ── Combate ───────────────────────────────────────────────────────────
    attack() {
        if (!this.isZombie || this.isAttacking) return;
        this.isAttacking = true;
        this._setAnimation('attack', false);
    }

    takeDamage() {
        if (!this.isZombie || this._comeTogether || this._hivemindActive) return;
        const mitig = (Game.instance?._rmbUpgrade === 'necrotic' && this._necroticOn)
            ? Config.necroticDmgMitig : 1;
        this.health -= mitig;
        if (this.sprite) {
            this.sprite.tint = 0xff0000;
            setTimeout(() => { if (this.sprite) this.sprite.tint = 0xffffff; }, 150);
        }
        if (this.health <= 0) this.dead = true;
        this._actualizarBarraSalud();
    }

    _actualizarBarraSalud() {
        const pct = Math.max(0, this.health / Config.playerMaxHealth) * 100;
        const bar = document.getElementById('health-bar');
        if (bar) {
            bar.style.width      = pct + '%';
            bar.style.background = pct > 50 ? Config.colorHealthFull : pct > 25 ? Config.colorHealthMid : Config.colorHealthLow;
        }
    }

    // ── Dash ──────────────────────────────────────────────────────────────
    dash() {
        if (this._dashCooldown > 0 || this._dashDuration > 0) return;

        let dx = 0, dy = 0;
        if (Input.isHeld('w')) dy -= 1;
        if (Input.isHeld('s')) dy += 1;
        if (Input.isHeld('a')) dx -= 1;
        if (Input.isHeld('d')) dx += 1;
        if (dx === 0 && dy === 0) dx = this.facingRight ? 1 : -1;

        const dir          = Utils.normalize(dx, dy);
        this._dashVx       = dir.x * Config.playerDashSpeed;
        this._dashVy       = dir.y * Config.playerDashSpeed;
        this._dashDuration = Config.playerDashDuration;
        this._dashCooldown = Config.playerDashCooldown * this._necroCD();
    }

    _necroCD() {
        return (Game.instance?._rmbUpgrade === 'necrotic' && this._necroticOn)
            ? Config.necroticDashRedux : 1;
    }

    _spawnDashTrail() {
        if (!this._worldContainer) return;
        const trail = new PIXI.Graphics();
        trail.beginFill(0xf8ff00, 0.4);
        trail.drawRoundedRect(-10, -16, 20, 28, 4);
        trail.endFill();
        trail.x = this.x;
        trail.y = this.y;
        this._worldContainer.addChild(trail);
        let alpha = 0.4;
        const fade = setInterval(() => {
            alpha     -= 0.05;
            trail.alpha = alpha;
            if (alpha <= 0) { clearInterval(fade); this._worldContainer.removeChild(trail); }
        }, 20);
    }

    // ── Movimiento ────────────────────────────────────────────────────────
    handleMovement(deltaTime) {
        if (this._comeTogether) return;
        if (this._hivemindActive && Game.instance?._hivemind?._phase === 'gather') return;

        let moveX = 0, moveY = 0;
        if (Input.isHeld('w') || Input.isHeld('arrowup'))    moveY -= 1;
        if (Input.isHeld('s') || Input.isHeld('arrowdown'))  moveY += 1;
        if (Input.isHeld('a') || Input.isHeld('arrowleft'))  moveX -= 1;
        if (Input.isHeld('d') || Input.isHeld('arrowright')) moveX += 1;

        if (moveX > 0) this.facingRight = true;
        else if (moveX < 0) this.facingRight = false;
        if (this.sprite) this.sprite.scale.x = this.facingRight ? 1 : -1;

        if (!this.isAttacking) {
            this._setAnimation(moveX !== 0 || moveY !== 0 ? 'move' : 'idle');
        }

        if (this._dashDuration > 0) {
            this.x += this._dashVx * deltaTime;
            this.y += this._dashVy * deltaTime;
            this._dashDuration--;
            if (this._dashDuration % 2 === 0) this._spawnDashTrail();
        } else {
            if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }
            let slow = (Game.instance?._rmbUpgrade === 'necrotic' && this._necroticOn)
                ? Config.necroticSlowToggle : 1;
            // Hivemind fase activa: velocidad fija
            if (this._hivemindActive && Game.instance?._hivemind?._phase === 'active') {
                this.x += moveX * Config.hivemindActiveSpeed * deltaTime;
                this.y += moveY * Config.hivemindActiveSpeed * deltaTime;
            } else {
                this.x += moveX * Config.playerSpeed * deltaTime * slow;
                this.y += moveY * Config.playerSpeed * deltaTime * slow;
            }
        }

        if (this._pushVx || this._pushVy) {
            const pushMult = (Game.instance?._rmbUpgrade === 'necrotic' && this._necroticOn)
                ? Config.necroticPushResist : 1;
            this.x   += this._pushVx * deltaTime * pushMult;
            this.y   += this._pushVy * deltaTime * pushMult;
            this._pushVx *= 0.85;
            this._pushVy *= 0.85;
        }

        World.clampToBounds(this);
    }

    // ── Update ────────────────────────────────────────────────────────────
    update(deltaTime) {
        if (this._bulletCooldown > 0) this._bulletCooldown -= deltaTime;
        if (this._dashCooldown  > 0) this._dashCooldown  -= deltaTime;
        this.handleMovement(deltaTime);
        this.container.x = this.x;
        this.container.y = this.y;
        this._actualizarBarrasHUD();
    }

    _actualizarBarrasHUD() {
        const dashMax  = Config.playerDashCooldown * this._necroCD();
        const dashPct  = this._dashCooldown > 0 ? 1 - (this._dashCooldown / dashMax) : 1;
        const r        = 50;
        const circum   = +(2 * Math.PI * r).toFixed(2);

        const arcDash = document.getElementById('arc-dash');
        if (arcDash) {
            arcDash.style.stroke           = Config.colorDash;
            arcDash.style.strokeDashoffset = (circum * (1 - Math.max(0, Math.min(1, dashPct)))).toFixed(2);
        }

        const lblDashC = document.getElementById('label-dash-center');
        if (lblDashC) lblDashC.textContent = Config.labelDash;
    }
}