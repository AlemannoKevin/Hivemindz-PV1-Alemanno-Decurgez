class Bala extends GameObject {
    constructor(startX, startY, angle, worldContainer) {
        super(startX, startY, worldContainer);
        this.x    = startX;
        this.y    = startY;
        this.vx   = Math.cos(angle) * Config.playerBulletSpeed;
        this.vy   = Math.sin(angle) * Config.playerBulletSpeed;
        this.dead = false;
        this._wc  = worldContainer;

        this.graphic = new PIXI.Graphics();
        this.graphic.beginFill(0x69f0ae);
        this.graphic.drawCircle(0, 0, 5);
        this.graphic.endFill();
        this.graphic.lineStyle(1.5, 0xccff66, 0.6);
        this.graphic.drawCircle(0, 0, 9);
        worldContainer.addChild(this.graphic);
    }

    update(allHumans, worldContainer, zombies) {
        this.x += this.vx;
        this.y += this.vy;
        this.graphic.x = this.x;
        this.graphic.y = this.y;

        if (this.x < 0 || this.x > Config.worldWidth ||
            this.y < 0 || this.y > Config.worldHeight) {
            this.dead = true;
            return;
        }

        for (const human of allHumans) {
            if (human._infected) continue;
            const dist = Utils.distance(this.x, this.y, human.x, human.y);
            if (dist < 20) {
                human.startInfection(worldContainer, zombies);
                this.dead = true;
                return;
            }
        }

        for (const cop of (Game.instance?.policia || [])) {
            if (cop._dead) continue;
            const dist = Utils.distance(this.x, this.y, cop.x, cop.y);
            if (dist < 20) {
                cop.takeDamage();
                this.dead = true;
                return;
            }
        }
    }

    destroy() {
        this._wc.removeChild(this.graphic);
    }
}

class BalaPolicia extends GameObject {
    constructor(startX, startY, angle, worldContainer) {
        super(startX, startY, worldContainer);
        this.x    = startX;
        this.y    = startY;
        this.vx   = Math.cos(angle) * Config.policiaBulletSpeed;
        this.vy   = Math.sin(angle) * Config.policiaBulletSpeed;
        this.dead = false;
        this._wc  = worldContainer;

        this.graphic = new PIXI.Graphics();
        this.graphic.beginFill(0xffeb3b);
        this.graphic.drawCircle(0, 0, 3);
        this.graphic.endFill();
        worldContainer.addChild(this.graphic);
    }

    update(allZombies, player) {
        this.x += this.vx;
        this.y += this.vy;
        this.graphic.x = this.x;
        this.graphic.y = this.y;

        if (this.x < 0 || this.x > Config.worldWidth ||
            this.y < 0 || this.y > Config.worldHeight) {
            this.dead = true;
            return;
        }

        for (const zombie of allZombies) {
            if (zombie._dead) continue;
            const dist = Utils.distance(this.x, this.y, zombie.x, zombie.y);
            if (dist < 16) {
                const speed = Math.hypot(this.vx, this.vy);
                zombie.x += (this.vx / speed) * (this._knockback ?? Config.policiaKnockback);
                zombie.y += (this.vy / speed) * (this._knockback ?? Config.policiaKnockback);
                World.clampToBounds(zombie);
                zombie._hp = (zombie._hp ?? 1) - (this._damage ?? Config.policiaBulletDamage);

                if (zombie.sprite) {
                    zombie.sprite.tint = 0xff4444;
                    setTimeout(() => {
                        if (!zombie._dead && zombie.sprite) zombie.sprite.tint = 0xffffff;
                    }, 150);
                }

                if (zombie._hp <= 0) zombie._dead = true;
                this.dead = true;
                return;
            }
        }

        if (player && player.isZombie) {
            const dp = Utils.distance(this.x, this.y, player.x, player.y);
            if (dp < 20) {
                player.takeDamage();
                this.dead = true;
                return;
            }
        }
    }

    destroy() {
        this._wc.removeChild(this.graphic);
    }
}