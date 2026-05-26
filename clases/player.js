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

        if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }

        this.x += moveX * Config.playerSpeed * deltaTime;
        this.y += moveY * Config.playerSpeed * deltaTime;

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
        this.handleMovement(deltaTime);
        this.container.x = this.x;
        this.container.y = this.y;
    }
}
