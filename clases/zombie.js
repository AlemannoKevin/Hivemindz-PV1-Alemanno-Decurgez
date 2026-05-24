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

        if (this.headingX > 0) {
            this.sprite.scale.x = 1;
        } else if (this.headingX < 0) {
            this.sprite.scale.x = -1;
        }
    }
    
    _setAnimation(animName, loop = true) {
      const frames = zombieAnimations[animName];
      if (!frames || this.sprite.textures === frames) return;

      this.sprite.textures = frames;
      this.sprite.loop     = loop;
      this.sprite.gotoAndPlay(0);
}

    update(allZombies, allHumans, deltaTime, worldContainer) {
    
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

        let nearestHuman = null;
        let nearestDist  = Config.zombieSeekRange;
        for (const human of allHumans) {
            if (human._infected || human._turning) continue;
            const d = Utils.distance(this.x, this.y, human.x, human.y);
            if (d < nearestDist) { nearestDist = d; nearestHuman = human; }
        }

        let goalX, goalY;
        if (nearestHuman) {
            
            const angle = Utils.angleTo(this.x, this.y, nearestHuman.x, nearestHuman.y);
            goalX = Math.cos(angle);
            goalY = Math.sin(angle);
        } else {
           
            this._wanderTimer -= deltaTime;
            if (this._wanderTimer <= 0) {
                const angle = Utils.randomAngle();
                this._wanderDirX = Math.cos(angle);
                this._wanderDirY = Math.sin(angle);
                this._wanderTimer = Utils.randomBetween(80, 160);
            }
            goalX = this._wanderDirX;
            goalY = this._wanderDirY;
        }

        const boidsForce = Boids.computeSteering(this, allZombies, {
            separationWeight: 0,    
            alignmentWeight:  0.5,
            cohesionWeight:   0.7,  
        });

        const direction = Boids.blendWithGoal(goalX, goalY, boidsForce.x, boidsForce.y, 0.65);
        this.headingX = direction.x;
        this.headingY = direction.y;

        this.x += direction.x * Config.zombieSpeed * deltaTime;
        this.y += direction.y * Config.zombieSpeed * deltaTime;
        World.clampToBounds(this);

        if (this._attackCooldown > 0) this._attackCooldown -= deltaTime;

            let humanInRange = null;
            for (const human of allHumans) {
                if (human._infected || human._turning) continue;
                const d = Utils.distance(this.x, this.y, human.x, human.y);
                if (d < Config.zombieAttackRange) {
                    humanInRange = human;
                    break;
                }
            }

            if (humanInRange && !this._isAttacking && this._attackCooldown <= 0) {
                this._isAttacking = true;
                this._attackCooldown = Config.zombieAttackCooldown; // El cooldown empieza YA
                this._setAnimation('attack', false);

                const targetHuman = humanInRange;

                this.sprite.onComplete = () => {
                    this._isAttacking = false;
                    this._setAnimation('move', true);
                    this.sprite.onComplete = null;

                    // La infección ocurre idealmente al terminar el zarpazo (o usá el setTimeout acá adentro si querés delay)
                    if (targetHuman && !targetHuman._infected && !targetHuman._turning) {
                        // Verificamos si sigue relativamente cerca antes de infectar
                        const finalDist = Utils.distance(this.x, this.y, targetHuman.x, targetHuman.y);
                        if (finalDist < Config.zombieAttackRange + 20) { 
                            targetHuman.startInfection(worldContainer, allZombies);
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