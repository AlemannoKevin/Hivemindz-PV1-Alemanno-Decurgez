class GameObject {
    constructor() {
        this.app            = null;
        this.worldContainer = null;
        this.camera         = null;
        this.player         = null;
        this.humans         = [];
        this.zombies        = [];

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
                
                this.player.attack();
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

        this.app.ticker.add(delta => this._tick(delta));

        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
    }

    _tick(delta) {
        this.player.update(delta);

        for (const human of this.humans) {

            human.update(this.humans, this.player, this.zombies, delta);
        }

        for (const zombie of this.zombies) {
            zombie.update(this.zombies, this.humans, delta, this.worldContainer);
        }

        this.camera.followTarget(this.player.x, this.player.y);
    }
};


