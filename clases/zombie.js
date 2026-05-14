class Zombie {
    constructor(startX, startY, worldContainer) {
        this.x = startX;
        this.y = startY;
        this.worldContainer = worldContainer;

        this.headingX = 1;
        this.headingY = 0;

        this._wanderTimer = Utils.randomBetween(60, 140);
        this._wanderDirX  = Math.cos(Utils.randomAngle());
        this._wanderDirY  = Math.sin(Utils.randomAngle());

        this.container = new PIXI.Container();
        worldContainer.addChild(this.container);
        this._buildVisual();
    }


    _buildVisual() {
        this.container.removeChildren();
        const g = new PIXI.Graphics();
        g.beginFill(0x558b2f);
        g.drawRoundedRect(-10, -13, 20, 24, 4);
        g.endFill();
        g.beginFill(0x8bc34a);
        g.drawCircle(0, -19, 8);
        g.endFill();
        g.beginFill(0xff1744);
        g.drawCircle(-3, -21, 2);
        g.drawCircle( 3, -21, 2);
        g.endFill();
        this.container.addChild(g);
    }

    update(allZombies, allHumans, deltaTime) {
    
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
        this.container.x = this.x;
        this.container.y = this.y;
    }
}