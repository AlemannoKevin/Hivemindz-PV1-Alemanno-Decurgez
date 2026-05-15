class Humano {
    constructor(startX, startY, worldContainer) {
        this.x = startX;
        this.y = startY;

        this.state = 'wander';

        this.headingX = 0;
        this.headingY = 0;

        this._wanderTimer    = Utils.randomBetween(60, 140);
        this._wanderDirX     = Math.cos(Utils.randomAngle());
        this._wanderDirY     = Math.sin(Utils.randomAngle());

        this._fleeTimer      = 0;

        this.container = new PIXI.Container();
        worldContainer.addChild(this.container);
        this._buildVisual();
        this._buildExclamation();
    }

    _buildVisual() {
         this.sprite = new PIXI.AnimatedSprite(humanAnimations.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.15;
            this.sprite.play();
            this.container.addChild(this.sprite);
            this.graphic = this.sprite;
    }

    _buildExclamation() {
        this.exclamation = new PIXI.Text('!', {
            fontFamily: 'monospace',
            fontSize:   16,
            fontWeight: 'bold',
            fill:       0xff3333,   // red
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 2,
        });
        this.exclamation.anchor.set(0.5, 1);
        this.exclamation.position.set(0, -38); // above the head
        this.exclamation.visible = false;
        this.container.addChild(this.exclamation);
    }

    _setBodyColor(hexColor) {
    
        if (this.sprite) {
          this.sprite.tint = hexColor;
      }
}

    // Cambios gráficos dependiendo del estado
    _enterState(newState) {
        this.state = newState;
        if (newState === 'wander') {
            this.exclamation.visible = false;
            this._setBodyColor(0xffffff);     
        } else if (newState === 'flee') {
            this._fleeTimer = Config.humanFleeFrames;
            this.exclamation.visible = true;
            this._setBodyColor(0xff8a65);     
        }
    }

    startInfection(worldContainer, zombies) {
        if (this._infected) return;
        this._infected = true;
        this._enterState('wander'); 

        const aura = new PIXI.Graphics();
        aura.beginFill(0x69f0ae, 0.5);
        aura.drawCircle(0, 0, 20);    
        aura.endFill();
        aura.filters = [new PIXI.BlurFilter(8)];

        this.update = () => {
            this.container.x = this.x;
            this.container.y = this.y;
        };

       
        let blinks = 0;
        const blinkInterval = setInterval(() => {
            this._setBodyColor(blinks % 2 === 0 ? 0x69f0ae : 0xe0c97f);
            blinks++;
            if (blinks >= 8) {
                clearInterval(blinkInterval);
                this.sprite.tint = 0xffffff;
                this.container.visible = false;
                zombies.push(new Zombie(this.x, this.y, worldContainer));
            }
        }, 200);
    }
    
      flipSprite() {
        if (!this.sprite) return;

        if (this.headingX > 0) {
            this.sprite.scale.x = 1;
        } else if (this.headingX < 0) {
            this.sprite.scale.x = -1;
        }
    }


    update(allHumans, player, allZombies, deltaTime) {
    
        for (const other of allHumans) {
            if (other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius) {
                const pushStrength = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                this.x += (dx / dist) * pushStrength;
                this.y += (dy / dist) * pushStrength;
            }
        }

        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);

        // Transiciones entre estados
        if (this.state === 'wander') {
            if (player.isZombie && distToPlayer < Config.humanFleeRange) {
            this._enterState('flee');
            }
    
        if (this.state === 'wander') {
            for (const zombie of allZombies) {
                const dz = Utils.distance(this.x, this.y, zombie.x, zombie.y);
                if (dz < Config.humanFleeRange) {
                    this._enterState('flee'); break;
                }
            }
        }
            
        } else if (this.state === 'flee') {
            this._fleeTimer -= deltaTime;
            if (this._fleeTimer <= 0) {
                this._enterState('wander');
            }
        }

        let goalX = 0, goalY = 0;
        let speed = Config.humanWalkSpeed;

        if (this.state === 'flee') {

            let closestThreatX = player.x;
            let closestThreatY = player.y;
            let closestDist    = distToPlayer;
            for (const zombie of allZombies) {
                const dz = Utils.distance(this.x, this.y, zombie.x, zombie.y);
                if (dz < closestDist) {
                    closestDist    = dz;
                    closestThreatX = zombie.x;
                    closestThreatY = zombie.y;
                }
            }
            const awayAngle = Utils.angleTo(closestThreatX, closestThreatY, this.x, this.y);
            goalX = Math.cos(awayAngle);
            goalY = Math.sin(awayAngle);
            speed = Config.humanFleeSpeed;

        } else {
            // Mientras deambulan, se genera una dirección random cada cierto tiempo
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

        const flockingWeights = this.state === 'flee'
            ? { separationWeight: 0, alignmentWeight: 1.4, cohesionWeight: 0.2 }
            : { separationWeight: 0, alignmentWeight: 0.7, cohesionWeight: 0.6 };

        const boidsForce = Boids.computeSteering(this, allHumans, flockingWeights);
        const goalWeight = this.state === 'flee' ? 0.7 : 0.45;
        const direction  = Boids.blendWithGoal(goalX, goalY, boidsForce.x, boidsForce.y, goalWeight);

        this.headingX = direction.x;
        this.headingY = direction.y;

        this.x += direction.x * speed * deltaTime;
        this.y += direction.y * speed * deltaTime;
       
        this.flipSprite();
        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;
    }
}