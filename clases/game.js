class Game {
    static instance = null;

    constructor() {
        Game.instance = this;

        this.app            = null;
        this.worldContainer = null;
        this.camera         = null;
        this.player         = null;
        this.obstacle       = null;
        this.humans         = [];
        this.zombies        = [];
        this.bullets        = [];
        this.policia        = [];
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

        this.obstacle = new Obstacle(
            Config.worldWidth  / 2 + 150,
            Config.worldHeight / 2 + 100,
            this.worldContainer
        );
        
        Input.init();
        Mouse.init();

        
        this.camera = new Camara(this.worldContainer);

        
        const spawnX = Config.worldWidth  / 2;
        const spawnY = Config.worldHeight / 2;
        this.player  = new Player(spawnX, spawnY, this.worldContainer);
        this.player._worldContainer = this.worldContainer;

        
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

        window.addEventListener('keydown', e => {
            if (e.code === 'Space') this.player.dash();
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
            const esPeleador = Math.random() < Config.brawlerRatio;
            this.humans.push(
                esPeleador
                    ? new Peleador(hx, hy, this.worldContainer)
                    : new Humano(hx, hy, this.worldContainer)
            );
        }
        
        this.policia = [];
        for (let i = 0; i < Config.policiaCount; i++) {
            let px, py, tries = 0;
            do {
                px = Utils.randomBetween(80, Config.worldWidth  - 80);
                py = Utils.randomBetween(80, Config.worldHeight - 80);
                tries++;
            } while (
                tries < 30 &&
                this.policia.some(c =>
                    Utils.distance(px, py, c.x, c.y) < 120
                )
            );
            const esSwat = Math.random() < Config.swatRatio;
            this.policia.push(
                esSwat
                    ? new Swat(px, py, this.worldContainer)
                    : new Policia(px, py, this.worldContainer)
            );
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
            this.app.ticker.stop();
            const screen = document.getElementById('death-screen');
            if (screen) screen.style.display = 'flex';
            return;
        }

        for (const human of this.humans) {

            human.update(this.humans, this.player, this.zombies, delta);
        }

        const lmbActive  = Mouse.leftHeld && this.player.isZombie;
        const lmbTargetX = Mouse.worldX(this.camera.offsetX);
        const lmbTargetY = Mouse.worldY(this.camera.offsetY);

        for (const zombie of this.zombies) {
            const controlled = lmbActive && this._isOnScreen(zombie);
            zombie.update(
                this.zombies, this.humans, this.policia,
                delta, this.worldContainer,
                controlled, lmbTargetX, lmbTargetY
            );
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(this.humans, this.worldContainer, this.zombies);
            if (bullet.dead) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }

        for (const policia of this.policia) {
            policia.update(this.zombies, this.humans, this.policia, this.player, this.bulletsPolice, this.worldContainer, delta);
        }

        for (let i = this.policia.length - 1; i >= 0; i--) {
            if (this.policia[i]._dead) {
                this.worldContainer.removeChild(this.policia[i].container);
                this.policia.splice(i, 1);
            }
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
        const aliveHumans = this.humans.filter(h => !h._infected).length;
        const counter = document.getElementById('human-counter');
        if (counter) counter.textContent = `HUMANS: ${aliveHumans}`;
    }

    _isOnScreen(entity) {
        const sx = entity.x * Config.zoom + this.camera.offsetX;
        const sy = entity.y * Config.zoom + this.camera.offsetY;
        return sx >= 0 && sx <= window.innerWidth &&
            sy >= 0 && sy <= window.innerHeight;
    }
};


