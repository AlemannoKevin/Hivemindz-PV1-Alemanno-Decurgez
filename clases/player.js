class Player {
    constructor(startX, startY, worldContainer) {
        this.x = startX;
        this.y = startY;

        this.isZombie = false;
        this.facingRight = true;
        this.isAttacking = false;
        this.health = Config.playerMaxHealth;
       
        this.container = new PIXI.Container();
        worldContainer.addChild(this.container);

        this._buildVisual();
        this._bulletCooldown = 0;
        this._dashCooldown  = 0;
        this._worldContainer = null;
        this._dashDuration  = 0;
        this._dashVx        = 0;
        this._dashVy        = 0;
    }

    _buildVisual() {
        this.container.removeChildren();
        const graphic = new PIXI.Graphics();

        if (!this.isZombie) {
            
            this.sprite = new PIXI.AnimatedSprite(playerAnimations.idle);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.15;
            this.sprite.play();
            this.container.addChild(this.sprite);
            
        } else {
            this.sprite = new PIXI.AnimatedSprite(zeroAnimations.idle);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.15;
            this.sprite.play();
            this.container.addChild(this.sprite);
        }

        this.container.addChild(graphic);
    }

    _setAnimation(animName, loop = true) {
        if (!this.sprite) return;

        const currentSet = this.isZombie ? zeroAnimations : playerAnimations;
        if (this.sprite.textures === currentSet[animName]) return;

        this.sprite.textures = currentSet[animName];
        this.sprite.loop = loop;
        this.sprite.gotoAndPlay(0);
        
        if (!loop) {
            this.sprite.onComplete = () => {
                this.isAttacking = false;
                this.sprite.onComplete = null; 
            };
        }
    }

    becomeZombie(worldContainer, humans, zombies) {
        if (this.isZombie) return;
        this.isZombie = true;
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'block';
        const bars = document.getElementById('cooldown-bars');
        if (bars) bars.style.display = 'flex';
        this._buildVisual();

        const ring = new PIXI.Graphics();
        worldContainer.addChild(ring);
        let frame = 0;
        const playerX = this.x;
        const playerY  = this.y;

        //Ataque AOE
        const animateRing = () => {
            frame++;
            const progress = frame / Config.aoeFadeFrames;   // 0 → 1
            const radius   = Config.aoeRadius * progress;
            const alpha    = 1 - progress;

            ring.clear();
            ring.lineStyle(4, 0xccff66, alpha * 0.4);
            ring.drawCircle(playerX, playerY, radius + 6);
            ring.lineStyle(2.5, 0x8bc34a, alpha);
            ring.beginFill(0x8bc34a, alpha * 0.15);
            ring.drawCircle(playerX, playerY, radius);
            ring.endFill();

            if (frame < Config.aoeFadeFrames) {
                requestAnimationFrame(animateRing);
            } else {
                ring.clear();
                worldContainer.removeChild(ring);
            }
        };
        requestAnimationFrame(animateRing);

        for (const human of humans) {
            const dist = Utils.distance(this.x, this.y, human.x, human.y);
            if (dist < Config.aoeRadius) {
                human.startInfection(worldContainer, zombies);
            }
        }
    }

    attack() {
        if (!this.isZombie || this.isAttacking) return;
        this.isAttacking = true;
        this._setAnimation('attack', false);
    }

    dash() {
        if (this._dashCooldown > 0 || this._dashDuration > 0) return;

        let dx = 0, dy = 0;
        if (Input.isHeld('w')) dy -= 1;
        if (Input.isHeld('s')) dy += 1;
        if (Input.isHeld('a')) dx -= 1;
        if (Input.isHeld('d')) dx += 1;

        if (dx === 0 && dy === 0) {
            dx = this.facingRight ? 1 : -1;
        }

        const dir      = Utils.normalize(dx, dy);
        this._dashVx   = dir.x * Config.playerDashSpeed;
        this._dashVy   = dir.y * Config.playerDashSpeed;
        this._dashDuration  = Config.playerDashDuration;
        this._dashCooldown  = Config.playerDashCooldown;
    }

    _spawnDashTrail(worldContainer) {
        if (!worldContainer) return;

        const trail = new PIXI.Graphics();
        trail.beginFill(0x69f0ae, 0.4);
        trail.drawRoundedRect(-10, -16, 20, 28, 4);
        trail.endFill();
        trail.x = this.x;
        trail.y = this.y;
        worldContainer.addChild(trail);

        let alpha = 0.4;
        const fade = setInterval(() => {
            alpha -= 0.05;
            trail.alpha = alpha;
            if (alpha <= 0) {
                clearInterval(fade);
                worldContainer.removeChild(trail);
            }
        }, 20);
    }

    handleMovement(deltaTime) {
        let moveX = 0, moveY = 0;

        if (Input.isHeld('w') || Input.isHeld('arrowup'))    moveY -= 1;
        if (Input.isHeld('s') || Input.isHeld('arrowdown'))  moveY += 1;
        if (Input.isHeld('a') || Input.isHeld('arrowleft'))  moveX -= 1;
        if (Input.isHeld('d') || Input.isHeld('arrowright')) moveX += 1;

        if (moveX > 0) this.facingRight = true;
        else if (moveX < 0) this.facingRight = false;

        if (this.sprite) {
            this.sprite.scale.x = this.facingRight ? 1 : -1;
        }

        if (!this.isAttacking) {
            if (moveX !== 0 || moveY !== 0) {
                this._setAnimation('move');
            } else {
                this._setAnimation('idle');
            }
        }

        if (this._dashDuration > 0) {
            this.x += this._dashVx * deltaTime;
            this.y += this._dashVy * deltaTime;
            this._dashDuration--;
            // Spawn trail every other frame
            if (this._dashDuration % 2 === 0) {
                this._spawnDashTrail(this._worldContainer);
            }
        } else {
            if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }
            this.x += moveX * Config.playerSpeed * deltaTime;
            this.y += moveY * Config.playerSpeed * deltaTime;
        }

        World.clampToBounds(this);
    }

    takeDamage() {
        if (!this.isZombie) return;
        this.health -= 1;

        if (this.sprite) {
            this.sprite.tint = 0xff4444;
            setTimeout(() => {
                if (this.sprite) this.sprite.tint = 0xffffff;
            }, 150);
        }

        if (this.health <= 0) {
            this.dead = true;
        }

        const pct = Math.max(0, this.health / Config.playerMaxHealth) * 100;
        const bar = document.getElementById('health-bar');
        if (bar) {
            bar.style.width = pct + '%';
            bar.style.background = pct > 50 ? '#4caf50' : pct > 25 ? '#ffb74d' : '#ef5350';
        }
    }

    update(deltaTime) {
        if (this._bulletCooldown > 0) this._bulletCooldown -= deltaTime;
        if (this._dashCooldown > 0) this._dashCooldown -= deltaTime;
        this.handleMovement(deltaTime);
        this.container.x = this.x;
        this.container.y = this.y;
        const dashPct = this._dashCooldown > 0
            ? 1 - (this._dashCooldown / Config.playerDashCooldown)
            : 1;
        const shotPct = this._bulletCooldown > 0
            ? 1 - (this._bulletCooldown / Config.playerBulletCooldown)
            : 1;

        const cdDash = document.getElementById('cd-dash');
        const cdShot = document.getElementById('cd-shot');
        if (cdDash) cdDash.style.height = (dashPct * 100) + '%';
        if (cdShot) cdShot.style.height = (shotPct * 100) + '%';
    }
}
