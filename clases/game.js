class Game {
    constructor() {
        this.app            = null;
        this.worldContainer = null;
        this.camera         = null;
        this.player         = null;
        this.humans         = [];
        this.zombies        = [];
        this.bullets        = [];
        this.officers       = [];
        this.bulletsPolice  = [];

        setup().then(() => this.start());
    }

    async start() {
       
        this.app = new PIXI.Application({
            width:           window.innerWidth,
            height:          window.innerHeight,
            backgroundColor: 0x000000,
            antialias:       true,
            resolution:      window.devicePixelRatio || 1,
            autoDensity:     true,
        });
        document.body.appendChild(this.app.view);

        await PIXI.Assets.load({
            alias: 'testBackground',
            src: 'testBackground.png' 
        });

       
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        
        World.buildBackground(this.worldContainer);

        
        Input.init();
        Mouse.init();

        
        this.camera = new Camara(this.worldContainer);

        
        const spawnX = Config.worldWidth  / 2;
        const spawnY = Config.worldHeight / 2;
        this.player  = new Player(spawnX, spawnY, this.worldContainer);

        
        window.addEventListener('mousedown', e => {
            if (e.button !== 2) return;
            if (!this.player.isZombie) {
               
                this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
            } else {
                
                if (this.player._bulletCooldown <= 0) {
                    this.player.attack();
                    this.player._bulletCooldown = Config.playerBulletCooldown;
                    const angle = Utils.angleTo(
                        this.player.x, this.player.y,
                        Mouse.worldX(this.camera.offsetX),
                        Mouse.worldY(this.camera.offsetY)
                    );
                    this.bullets.push(
                        new Bala(this.player.x, this.player.y, angle, this.worldContainer)
                    );
                }
            }
        });

        this.humans = [];
        for (let i = 0; i < Config.humanCount; i++) {
            let hx, hy, tries = 0;
            do {
                hx = Utils.randomBetween(80, Config.worldWidth  - 80);
                hy = Utils.randomBetween(80, Config.worldHeight - 80);
                tries++;
            } while (
                tries < 30 &&
                Utils.distance(hx, hy, spawnX, spawnY) < 200
            );
            this.humans.push(new Humano(hx, hy, this.worldContainer));
        }
        
        this.officers = [];
        for (let i = 0; i < Config.policiaCount; i++) {
            const px = Utils.randomBetween(80, Config.worldWidth  - 80);
            const py = Utils.randomBetween(80, Config.worldHeight - 80);
            this.officers.push(new Policia(px, py, this.worldContainer));
        }
        this.bulletsPolice = [];

        this.app.ticker.add(delta => this._tick(delta));

        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
    }

    _tick(delta) {
        this.player.update(delta);

        if (this.player.dead) {
            console.log('Game over');
            this.app.ticker.stop();
            return;
        }

        for (const human of this.humans) {

            human.update(this.humans, this.player, this.zombies, delta);
        }

        for (const zombie of this.zombies) {
            zombie.update(this.zombies, this.humans, delta, this.worldContainer);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(this.humans, this.worldContainer, this.zombies);
            if (bullet.dead) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }

        for (const policia of this.officers) {
            policia.update(this.zombies, this.player, this.bulletsPolice, this.worldContainer, delta);
        }

        for (let i = this.bulletsPolice.length - 1; i >= 0; i--) {
            const b = this.bulletsPolice[i];
            b.update(this.zombies, this.player);
            if (b.dead) {
                b.destroy();
                this.bulletsPolice.splice(i, 1);
            }
        }

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            if (this.zombies[i]._dead) {
                this.worldContainer.removeChild(this.zombies[i].container);
                this.zombies.splice(i, 1);
            }
        }

        this.camera.followTarget(this.player.x, this.player.y);
    }
};


