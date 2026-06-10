class Zombie extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x            = startX;
        this.y            = startY;
        this.worldContainer = worldContainer;

        this.headingX    = 1;
        this.headingY    = 0;

        this._wanderTimer    = Utils.randomBetween(60, 140);
        this._wanderDirX     = Math.cos(Utils.randomAngle());
        this._wanderDirY     = Math.sin(Utils.randomAngle());
        this._isAttacking    = false;
        this._attackCooldown = 0;
        this._slowTimer      = 0;
        this._pushVx         = 0;
        this._pushVy         = 0;
        this._ctBoostTimer   = 0;

        this._buildVisual();
    }

    // ── Visual ────────────────────────────────────────────────────────────
    _buildVisual() {
        this.sprite = new PIXI.AnimatedSprite(zombieAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
        this.graphic = this.sprite;
    }

    _setAnimation(animName, loop = true) {
        const frames = zombieAnimations[animName];
        if (!frames || this.sprite.textures === frames) return;
        this.sprite.textures = frames;
        this.sprite.loop     = loop;
        this.sprite.gotoAndPlay(0);
    }

    flipSprite() {
        if (!this.sprite || Math.hypot(this.headingX, this.headingY) < 0.1) return;
        if (this.headingX > 0.1)       this.sprite.scale.x =  1;
        else if (this.headingX < -0.1) this.sprite.scale.x = -1;
    }

    _actualizarContorno(activo) {
        if (!this.sprite) return;
        if (activo && !this._contornoActivo) {
            this._contornoActivo = true;
            this.sprite.tint = 0x88bbff;
        } else if (!activo && this._contornoActivo) {
            this._contornoActivo = false;
            this.sprite.tint = 0xffffff;
        }
    }

    // ── Boost de Come Together ────────────────────────────────────────────
    _tickCTBoost(deltaTime) {
        if (this._ctBoostTimer <= 0) return;
        this._ctBoostTimer -= deltaTime;
        if (this._ctBoostTimer <= 0) {
            if (this.sprite) this.sprite.tint = 0xffffff;
            this._ctReducedAttackCD = false;
        }
    }

    _speedMultiplier() {
        const slow        = this._slowTimer > 0 ? Config.brawlerSlowFactor : 1;
        const orbitBoost  = Game.instance?._lmbUpgrade === 'orbit' ? Config.orbitSpeedBoost : 1;
        const centralBoost = this._bioCentral ? Config.bioCentralSpeedBoost : 1;
        const ctBoost     = this._ctBoostTimer > 0 ? Config.comeTogetherSpeedBoost : 1;
        return slow * orbitBoost * centralBoost * ctBoost;
    }

    // ── Objetivo más cercano ──────────────────────────────────────────────
    _nearestTarget(allHumans, allPolicia) {
        const range = this._bioCentral
            ? Config.zombieSeekRange * (this._bioDetectBoost || 1)
            : Config.zombieSeekRange;
        let nearest = null, nearestDist = range;

        for (const h of allHumans) {
            if (h._infected || h._turning) continue;
            const d = Utils.distance(this.x, this.y, h.x, h.y);
            if (d < nearestDist) { nearestDist = d; nearest = h; }
        }
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            const d = Utils.distance(this.x, this.y, cop.x, cop.y);
            if (d < nearestDist) { nearestDist = d; nearest = cop; }
        }
        return nearest;
    }

    // ── Objetivo de movimiento ────────────────────────────────────────────
    _calcGoal(nearestTarget, lmbControlled, lmbX, lmbY) {
        let goalX, goalY, speedBoost = 1;

        const enOrbita = Game.instance?._lmbUpgrade === 'zaturn'
            && Mouse.leftHeld && this._orbitTargetX !== undefined;

        if (enOrbita) {
            const dir = Utils.normalize(this._orbitTargetX - this.x, this._orbitTargetY - this.y);
            goalX = dir.x; goalY = dir.y;
            speedBoost = Config.orbitSpeedBoost;
        } else if (lmbControlled) {
            const dir = Utils.normalize(lmbX - this.x, lmbY - this.y);
            goalX = dir.x; goalY = dir.y;
            speedBoost = Config.lmbSpeedBoost;
        } else if (nearestTarget) {
            const angle = Utils.angleTo(this.x, this.y, nearestTarget.x, nearestTarget.y);
            goalX = Math.cos(angle); goalY = Math.sin(angle);
        } else {
            this._wanderTimer -= 1;
            if (this._wanderTimer <= 0) {
                const angle      = Utils.randomAngle();
                this._wanderDirX = Math.cos(angle);
                this._wanderDirY = Math.sin(angle);
                this._wanderTimer = Utils.randomBetween(80, 160);
            }
            goalX = this._wanderDirX; goalY = this._wanderDirY;
        }
        return { goalX, goalY, speedBoost };
    }

    // ── Ataque ────────────────────────────────────────────────────────────
    _tryAttack(allHumans, allPolicia, worldContainer, allZombies) {
        if (this._isAttacking || this._attackCooldown > 0) return;

        let target = allHumans.find(h =>
            !h._infected && !h._turning &&
            Utils.distance(this.x, this.y, h.x, h.y) < Config.zombieAttackRange
        );
        if (!target) target = allPolicia.find(c =>
            !c._dead && Utils.distance(this.x, this.y, c.x, c.y) < Config.zombieAttackRange
        );
        if (!target) return;

        this._isAttacking    = true;
        this._attackCooldown = Config.zombieAttackCooldown * (this._ctReducedAttackCD ? Config.comeTogetherAttackCooldownMult : 1);
        this._setAnimation('attack', false);

        const captured = target;
        this.sprite.onComplete = () => {
            this._isAttacking  = false;
            this._setAnimation('move', true);
            this.sprite.onComplete = null;

            if (Utils.distance(this.x, this.y, captured.x, captured.y) >= Config.zombieAttackRange + 20) return;

            if (captured.startInfection) {
                if (captured instanceof Peleador) {
                    captured._infeccionAcum = (captured._infeccionAcum || 0) + 1;
                    captured._actualizarBarraInfeccion?.();
                    if (captured._infeccionAcum >= Config.brawlerInfectHits) {
                        captured._infeccionAcum = 0;
                        captured.startInfection(worldContainer, allZombies);
                    }
                } else {
                    captured.startInfection(worldContainer, allZombies);
                }
            } else {
                captured.takeDamage?.();
            }
        };
    }

    // ── Update ────────────────────────────────────────────────────────────
    update(allZombies, allHumans, allPolicia, deltaTime, worldContainer, lmbControlled = false, lmbX = 0, lmbY = 0) {
        if (this._slowTimer      > 0) this._slowTimer      -= deltaTime;
        if (this._attackCooldown > 0) this._attackCooldown -= deltaTime;
        this._tickCTBoost(deltaTime);

        // Come Together: movimiento gestionado externamente
        if (this._comeTogether) { this._setAnimation('move', true); return; }

        // Biomass: resistencia al push
        if (this._bioBall) { this._pushVx *= Config.bioPushResist; this._pushVy *= Config.bioPushResist; }

        this._actualizarContorno(false);

        // Separación (el central la ignora)
        if (!this._bioCentral) {
            for (const other of allZombies) {
                if (other === this) continue;
                const dx = this.x - other.x, dy = this.y - other.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < Config.boidsSepRadius) {
                    const push = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                    this.x += (dx / dist) * push;
                    this.y += (dy / dist) * push;
                }
            }
        }

        const nearestTarget       = this._nearestTarget(allHumans, allPolicia);
        const { goalX, goalY, speedBoost } = this._calcGoal(nearestTarget, lmbControlled, lmbX, lmbY);

        const boidsForce    = Boids.computeSteering(this, allZombies, { separationWeight: 0, alignmentWeight: 0.5, cohesionWeight: 0.7 });
        const obstacleForce = Utils.repelFromObstacles(this.x, this.y, Config.obstacleRepelRadius, Config.obstacleRepelForce);

        const direction = Boids.blendWithGoal(
            goalX + obstacleForce.x, goalY + obstacleForce.y,
            boidsForce.x, boidsForce.y, 0.65
        );
        this.headingX = direction.x;
        this.headingY = direction.y;

        const speed = Config.zombieSpeed * this._speedMultiplier() * speedBoost;
        this.x += direction.x * speed * deltaTime;
        this.y += direction.y * speed * deltaTime;

        // Push
        this.x += this._pushVx * deltaTime;
        this.y += this._pushVy * deltaTime;
        this._pushVx *= 0.85;
        this._pushVy *= 0.85;
        if (!this._isAttacking) {
            this._tryAttack(allHumans, allPolicia, worldContainer, allZombies);
        }
        if (!this._isAttacking) {
            this._setAnimation('move', true);
        }
        this._clampAndSync();
        this.flipSprite();
    }
}