class Zombie extends GameObject{
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;
        this.worldContainer = worldContainer;

        this.headingX = 1;
        this.headingY = 0;

        this._wanderTimer = Utils.randomBetween(60, 140);
        this._wanderDirX  = Math.cos(Utils.randomAngle());
        this._wanderDirY  = Math.sin(Utils.randomAngle());
        this._isAttacking  = false;
        this._attackCooldown = 0;
        this._slowTimer = 0;
        this._pushVx = 0; 
        this._pushVy = 0;   

        this._buildVisual();
    }


    _buildVisual() {
        this.sprite = new PIXI.AnimatedSprite(zombieAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
        this.graphic = this.sprite;
    }
    
    flipSprite() {
        if (!this.sprite) return;
        const speed = Math.hypot(this.headingX, this.headingY);
        if (speed < 0.1) return;
        if (this.headingX > 0.1)       this.sprite.scale.x =  1;
        else if (this.headingX < -0.1) this.sprite.scale.x = -1;
    }
    
    _setAnimation(animName, loop = true) {
      const frames = zombieAnimations[animName];
      if (!frames || this.sprite.textures === frames) return;

      this.sprite.textures = frames;
      this.sprite.loop     = loop;
      this.sprite.gotoAndPlay(0);
    }

    _actualizarContorno(activo) {
        if (!this.sprite) return;
        if (activo && !this._contornoActivo) {
            this._contornoActivo = true;
            this.sprite.tint = 0x88bbff; // hue azulado
        } else if (!activo && this._contornoActivo) {
            this._contornoActivo = false;
            this.sprite.tint = 0xffffff; // restauramos
        }
    }

    update(allZombies, allHumans, allPolicia, deltaTime, worldContainer, lmbControlled = false, lmbX = 0, lmbY = 0) {
    
        if (this._slowTimer > 0) this._slowTimer -= deltaTime;

        // En modo biomass o comeTogether: el movimiento lo manejan sus clases
        if (this._comeTogether) {
            this._setAnimation('move', true);
            return;
        }
        // _bioBall: resistencia al push, siguen con AI normal
        if (this._bioBall) {
            this._pushVx *= Config.bioPushResist;
            this._pushVy *= Config.bioPushResist;
        }
        this._actualizarContorno(false);

        // El zombie central de biomass ignora el empuje de separación
        if (!this._bioCentral) {
            for (const other of allZombies) {
                if (other === this) continue;
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < Config.boidsSepRadius) {
                    const push = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                    this.x += (dx / dist) * push;
                    this.y += (dy / dist) * push;
                }
            }
        }

        let nearestTarget = null;
        const detectRange = this._bioCentral
            ? Config.zombieSeekRange * (this._bioDetectBoost || 1)
            : Config.zombieSeekRange;
        let nearestDist   = detectRange;

        for (const human of allHumans) {
            if (human._infected || human._turning) continue;
            const d = Utils.distance(this.x, this.y, human.x, human.y);
            if (d < nearestDist) { nearestDist = d; nearestTarget = human; }
        }

        for (const cop of (allPolicia || [])) {
            if (cop._dead) continue;
            const d = Utils.distance(this.x, this.y, cop.x, cop.y);
            if (d < nearestDist) { nearestDist = d; nearestTarget = cop; }
        }

        let goalX, goalY;
        let speedBoost = 1;

        const enOrbita = Game.instance?._lmbUpgrade === 'zaturn'
            && Mouse.leftHeld
            && this._orbitTargetX !== undefined;

        if (enOrbita) {
            // Caminamos hacia el punto objetivo del anillo (que rota en game.js)
            const dir = Utils.normalize(this._orbitTargetX - this.x, this._orbitTargetY - this.y);
            goalX      = dir.x;
            goalY      = dir.y;
            speedBoost = Config.orbitSpeedBoost;
        } else if (lmbControlled) {
            const dir = Utils.normalize(lmbX - this.x, lmbY - this.y);
            goalX      = dir.x;
            goalY      = dir.y;
            speedBoost = Config.lmbSpeedBoost;
        } else {
            if (nearestTarget) {
                const angle = Utils.angleTo(this.x, this.y, nearestTarget.x, nearestTarget.y);
                goalX = Math.cos(angle);
                goalY = Math.sin(angle);
            } else {
                this._wanderTimer -= deltaTime;
                if (this._wanderTimer <= 0) {
                    const angle      = Utils.randomAngle();
                    this._wanderDirX = Math.cos(angle);
                    this._wanderDirY = Math.sin(angle);
                    this._wanderTimer = Utils.randomBetween(80, 160);
                }
                goalX = this._wanderDirX;
                goalY = this._wanderDirY;
            }
        }

        const boidsForce = Boids.computeSteering(this, allZombies, {
            separationWeight: 0,
            alignmentWeight:  0.5,
            cohesionWeight:   0.7,
        });
        
        const obstacleForce = Utils.repelFromObstacles(
            this.x, this.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );

        goalX += obstacleForce.x;
        goalY += obstacleForce.y;

        const direction = Boids.blendWithGoal(goalX, goalY, boidsForce.x, boidsForce.y, 0.65);
        this.headingX = direction.x;
        this.headingY = direction.y;

        const orbitBoost   = (Game.instance?._lmbUpgrade === 'orbit') ? Config.orbitSpeedBoost : 1;
        const centralBoost = this._bioCentral ? Config.bioCentralSpeedBoost : 1;
     
        if (this._ctBoostTimer > 0) {
            this._ctBoostTimer -= deltaTime;
            if (this._ctBoostTimer <= 0) {
                if (this.sprite) this.sprite.tint = 0xffffff;
                this._ctReducedAttackCD = false;
            }
        }
        
        const ctBoost = (this._ctBoostTimer > 0) ? Config.comeTogetherSpeedBoost : 1;
        const speedMultiplier = (this._slowTimer > 0 ? Config.brawlerSlowFactor : 1) * speedBoost * orbitBoost * centralBoost * ctBoost;
        this.x += direction.x * Config.zombieSpeed * speedMultiplier * deltaTime;
        this.y += direction.y * Config.zombieSpeed * speedMultiplier * deltaTime;

        this.x += this._pushVx * deltaTime;
        this.y += this._pushVy * deltaTime;
        this._pushVx *= 0.85;   
        this._pushVy *= 0.85;
        World.clampToBounds(this);

        if (this._attackCooldown > 0) this._attackCooldown -= deltaTime;

            let targetInRange = null;
            for (const human of allHumans) {
                if (human._infected || human._turning) continue;
                const d = Utils.distance(this.x, this.y, human.x, human.y);
                if (d < Config.zombieAttackRange) { targetInRange = human; break; }
            }
          
            if (!targetInRange) {
                for (const cop of (allPolicia || [])) {
                    if (cop._dead) continue;
                    const d = Utils.distance(this.x, this.y, cop.x, cop.y);
                    if (d < Config.zombieAttackRange) { targetInRange = cop; break; }
                }
            }

            if (targetInRange && !this._isAttacking && this._attackCooldown <= 0) {
                this._isAttacking    = true;
                const attackCDMult   = this._ctReducedAttackCD ? Config.comeTogetherAttackCooldownMult : 1;
                this._attackCooldown = Config.zombieAttackCooldown * attackCDMult;
                this._setAnimation('attack', false);

                const capturedTarget = targetInRange;

                this.sprite.onComplete = () => {
                    this._isAttacking = false;
                    this._setAnimation('move', true);
                    this.sprite.onComplete = null;

                    const finalDist = Utils.distance(this.x, this.y, capturedTarget.x, capturedTarget.y);
                    if (finalDist < Config.zombieAttackRange + 20) {
                        if (capturedTarget.startInfection) {
                            if (capturedTarget instanceof Peleador) {
                                capturedTarget._infeccionAcum = (capturedTarget._infeccionAcum || 0) + 1;
                                if (capturedTarget._actualizarBarraInfeccion) capturedTarget._actualizarBarraInfeccion();
                                if (capturedTarget._infeccionAcum >= Config.brawlerInfectHits) {
                                    capturedTarget._infeccionAcum = 0;
                                    capturedTarget.startInfection(worldContainer, allZombies);
                                }
                            } else {
                                capturedTarget.startInfection(worldContainer, allZombies);
                            }
                        } else if (capturedTarget.takeDamage) {
                            capturedTarget.takeDamage();
                        }
                    }
                };
            }
            
            if (!this._isAttacking) {
                this._setAnimation('move', true);
            }

            // Voltear el sprite según la dirección
            this.flipSprite();

            // Actualizar posición del contenedor en Pixi
            this.container.x = this.x;
            this.container.y = this.y;
    }
}