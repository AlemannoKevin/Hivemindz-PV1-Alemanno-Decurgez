class Game {
    static instance = null;

    constructor() {
        Game.instance = this;

        this.app                = null;
        this.worldContainer     = null;
        this.camera             = null;
        this.player             = null;
        this.obstacle           = null;
        this.humans             = [];
        this.zombies            = [];
        this.bullets            = [];
        this.policia            = [];
        this.bulletsPolice      = [];

        this._upgradeCount      = 0;                    // cuántas veces apareció la pantalla
        this._paused            = false;
        this._lmbUpgrade        = null;                 // id de la habilidad LMB elegida
        this._rmbUpgrade        = null;                 // id de la habilidad RMB elegida
        this._daggerHits        = {};                   // hits acumulados por humano para la daga
        this._habilidadesUsadas = [];                   // ids ya ofrecidos
        this._zombieProyectil   = null;                 // zombie volando (combustion)
        this._combustionCD      = 0;                    // cooldown de combustion 
        this._bioball           = null;                 // instancia activa de BiomassBall
        this._bioCD             = 0;                    // cooldown post-bola
        this._comeTogether      = null;                 // instancia activa de ComeTogether
        this._comeTogetherCD    = 0;
        this._waveMode          = false;
        this._waveNumber        = 0;
        this._waveTimer         = 0;
        this._waveUpgradeTimer  = 0;
        this._gameMode          = null;                  // 'normal' o 'waves'
        this._combustionClick   = false;                 // flag de click para combustion
        this._lmbOverheat       = Config.lmbOverheatMax; // carga actual
        this._lmbOnCooldown     = false;                 // en cooldown duro
        this._lmbCooldownTimer  = 0;
        this._startTimer        = Config.startTimerDuration;
        this._startTimerOn      = true;
        this._necroticPulses    = null;

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

        await PIXI.Assets.load([
            { alias: 'testBackground',  src: 'testBackground.png'  },
            { alias: 'testBackground2', src: 'testBackground2.png' },
            { alias: 'ruinedCar1',      src: 'ruinedCar1.png'      },
        ]);
       
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        
        World.buildBackground(this.worldContainer);

        // Obstáculo principal (el que usan los boids como referencia)
        this.obstacle = new Obstacle(
            Config.worldWidth  / 2 + 150,
            Config.worldHeight / 2 + 100,
            this.worldContainer
        );

        // Obstáculos adicionales decorativos
        this._obstacles = [
            new Obstacle(Config.worldWidth * 0.15, Config.worldHeight * 0.2,  this.worldContainer),
            new Obstacle(Config.worldWidth * 0.8,  Config.worldHeight * 0.15, this.worldContainer),
            new Obstacle(Config.worldWidth * 0.25, Config.worldHeight * 0.75, this.worldContainer),
            new Obstacle(Config.worldWidth * 0.75, Config.worldHeight * 0.8,  this.worldContainer),
            new Obstacle(Config.worldWidth * 0.5,  Config.worldHeight * 0.2,  this.worldContainer),
            new Obstacle(Config.worldWidth * 0.6,  Config.worldHeight * 0.65, this.worldContainer),
        ];
        
        Input.init();
        Mouse.init();

        
        this.camera = new Camara(this.worldContainer);

        
        const spawnX = Config.worldWidth  / 2;
        const spawnY = Config.worldHeight / 2;
        this.player  = new Player(spawnX, spawnY, this.worldContainer);
        this.player._worldContainer = this.worldContainer;

        window.addEventListener('mousedown', e => {
            const mx = Mouse.worldX(this.camera.offsetX);
            const my = Mouse.worldY(this.camera.offsetY);

            if (e.button === 0) {
                // LMB — solo funciona si hay un upgrade activo
                if (!this.player.isZombie) return;

                if (this._lmbUpgrade === 'biomass') {
                    if (!this._bioball && this._bioCD <= 0) {
                        this._bioball = new BiomassBall(
                            mx, my,
                            this.zombies, this.worldContainer
                        );
                        // El cooldown empieza al crear la bola
                        this._bioCD = Config.bioCooldown;
                    }

                } else if (this._lmbUpgrade === 'combustion') {
                    this._combustionClick = true;
                } else if (this._lmbUpgrade === 'cometogether') {
                    if (!this._comeTogether && this._comeTogetherCD <= 0) {
                        this._comeTogether = new ComeTogether(
                            this.player, this.zombies, this.worldContainer
                        );
                    }
                }
                // Sin upgrade LMB: no hace nada
                return;
            }

            if (e.button !== 2) return;

            // RMB
            if (!this.player.isZombie) {
                this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
                this._startTimerOn = false;
                const timerEl = document.getElementById('start-timer');
                if (timerEl) timerEl.style.display = 'none';
                return;
            }

            if (this.player._bulletCooldown <= 0 && !this.player._comeTogether && this._rmbUpgrade !== 'necrotic') {
                this.player.attack();
                const angle = Utils.angleTo(this.player.x, this.player.y, mx, my);

                if (this._rmbUpgrade === 'punch') {
                    this.player._bulletCooldown = Config.punchCooldown;
                    this._aplicarPunch(mx, my);
                } else if (this._rmbUpgrade === 'dagger') {
                    this.player._bulletCooldown = Config.daggerCooldown;
                    const angulos = [
                        angle - Config.daggerSpreadAngle,
                        angle,
                        angle + Config.daggerSpreadAngle,
                    ];
                    for (const a of angulos) {
                        this.bullets.push(
                            new BalaDagger(this.player.x, this.player.y, a, this.worldContainer, this._daggerHits)
                        );
                    }
                } else if (this._rmbUpgrade === 'pit') {
                    this.player._bulletCooldown = Config.playerBulletCooldown;
                    this.bullets.push(
                        new BalaPit(this.player.x, this.player.y, angle, this.worldContainer)
                    );
                } else {
                    this.player._bulletCooldown = Config.playerBulletCooldown;
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

        window.addEventListener('wheel', e => {
            this.camera.ajustarZoom(e.deltaY > 0 ? 1 : -1);
        });
    }

    _tick(delta) {
        if (this._paused) return;
        if (!this._gameMode) return;

        // Timer de inicio
        if (this._startTimerOn) {
            this._startTimer -= delta;
            const timerEl = document.getElementById('start-timer');
            if (timerEl) {
                const segs = Math.ceil(this._startTimer / 60);
                timerEl.textContent = `TRANSFORMING IN: ${segs}s`;
            }
            if (this._startTimer <= 0) {
                this._startTimerOn = false;
                if (timerEl) timerEl.style.display = 'none';
                if (!this.player.isZombie) {
                    this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
                }
            }
        }

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

        // Overheat del LMB básico
        const lmbTargetX = Mouse.worldX(this.camera.offsetX);
        const lmbTargetY = Mouse.worldY(this.camera.offsetY);
        let lmbActive = false;

        // Actualizamos barra LMB en el HUD
        const cdLmb = document.getElementById('cd-lmb');
        if (cdLmb) {
            if (!this._lmbUpgrade) {
                // Básico: muestra el overheat
                if (this._lmbOnCooldown) {
                    const pct = 1 - (this._lmbCooldownTimer / Config.lmbOverheatCooldown);
                    cdLmb.style.height     = (pct * 100) + '%';
                    cdLmb.style.background = '#ef5350'; // rojo cuando está en cooldown
                } else {
                    const pct = this._lmbOverheat / Config.lmbOverheatMax;
                    cdLmb.style.height     = (pct * 100) + '%';
                    cdLmb.style.background = pct > 0.3 ? '#69f0ae' : '#ffb74d';
                }
            } else if (this._lmbUpgrade === 'biomass') {
                // Biomass: muestra cooldown de la bola
                const pct = this._bioCD > 0
                    ? 1 - (this._bioCD / Config.bioCooldown)
                    : 1;
                cdLmb.style.height     = (pct * 100) + '%';
                cdLmb.style.background = '#69f0ae';
       
            } else if (this._lmbUpgrade === 'combustion') {
                const pct = this._combustionCD > 0
                    ? 1 - (this._combustionCD / Config.combustionCooldown)
                    : 1;
                cdLmb.style.height     = (pct * 100) + '%';
                cdLmb.style.background = '#ff7043';
            } else if (this._lmbUpgrade === 'cometogether') {
                const cdMax = Config.comeTogetherDuration * 2;
                const pct   = this._comeTogetherCD > 0
                    ? 1 - (this._comeTogetherCD / cdMax)
                    : 1;
                cdLmb.style.height     = (pct * 100) + '%';
                cdLmb.style.background = '#69f0ae';
            }
        }

        if (!this._lmbUpgrade && this.player.isZombie) {
            if (this._lmbOnCooldown) {
                // En cooldown duro: recargamos el timer
                this._lmbCooldownTimer -= delta;
                if (this._lmbCooldownTimer <= 0) {
                    this._lmbOnCooldown = false;
                    this._lmbOverheat   = Config.lmbOverheatMax;
                }
            } else if (Mouse.leftHeld && this._lmbOverheat > 0) {
                // Usando el LMB: consumimos la barra
                lmbActive = true;
                this._lmbOverheat -= delta;
                if (this._lmbOverheat <= 0) {
                    this._lmbOverheat      = 0;
                    this._lmbOnCooldown    = true;
                    this._lmbCooldownTimer = Config.lmbOverheatCooldown;
                    lmbActive = false;
                }
            } else if (!Mouse.leftHeld && this._lmbOverheat < Config.lmbOverheatMax) {
                // Recargamos a ritmo más lento
                this._lmbOverheat = Math.min(
                    Config.lmbOverheatMax,
                    this._lmbOverheat + delta * Config.lmbRechargeRate
                );
            }
        }

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
            const z = this.zombies[i];
            if (z._dead && !z._bioBall) {
                this.worldContainer.removeChild(z.container);
                this.zombies.splice(i, 1);
            }
        }

        this.camera.followTarget(this.player.x, this.player.y);

        if (!this._waveMode) {
            const aliveHumans = this.humans.filter(h => !h._infected).length;
            const counter = document.getElementById('human-counter');
            if (counter) counter.textContent = `HUMANS: ${aliveHumans}`;

            // Upgrades en modo normal: cuando quedan 300, 200 y 100 humanos
            if (this.player.isZombie && !this._paused) {
                const thresholds = [300, 200, 100];
                const idx = this._upgradeCount;
                if (idx < thresholds.length && aliveHumans <= thresholds[idx]) {
                    this._upgradeCount++;
                    this._mostrarUpgrade();
                }
            }

            // Victoria en modo normal: todos infectados
            if (this.player.isZombie && this.humans.every(h => h._infected)) {
                this._mostrarVictoria();
            }
        }

        // LMB: combustion
        if (this._lmbUpgrade === 'combustion') {
            this._tickCombustion(delta);
        }

        // RMB: necrotic pulses
        if (this._rmbUpgrade === 'necrotic' && this.player.isZombie) {
            if (!this._necroticPulses) {
                this._necroticPulses = new NecroticPulses(this.player, this.worldContainer);
            }
            this._necroticPulses.update(delta, this.humans, this.policia, this.zombies);
        }

        // LMB: come together
        if (this._lmbUpgrade === 'cometogether') {
            if (this._comeTogether && !this._comeTogether._muerto) {
                this._comeTogether.update(delta, this.humans, this.policia);
            } else if (this._comeTogether && this._comeTogether._muerto) {
                this._comeTogetherCD = Config.comeTogetherDuration * 2;
                this._comeTogether   = null;
            }
            if (this._comeTogetherCD > 0) this._comeTogetherCD -= delta;
        }

        // Waves mode tick
        if (this._waveMode) this._tickWaves(delta);

        // LMB: biomass
        if (this._lmbUpgrade === 'biomass') {
            if (this._bioball && !this._bioball._muerto) {
                this._bioball.update(
                    delta, this.humans, this.policia, this.zombies, this.worldContainer
                );
            } else if (this._bioball && this._bioball._muerto) {
                this._bioball = null;
            }
            if (this._bioCD > 0) this._bioCD -= delta;
        }

        // Actualizar charcos de veneno
        for (let i = charcos.length - 1; i >= 0; i--) {
            charcos[i].update(delta, this.humans, this.policia, this.zombies);
            if (charcos[i]._muerto) charcos.splice(i, 1);
        }

        // Actualizar zombie proyectil (combustion)
        if (this._zombieProyectil && !this._zombieProyectil._muerto) {
            this._zombieProyectil.update(delta, this.humans, this.policia, this.zombies, this.worldContainer);
        }
    }

    _isOnScreen(entity) {
        const sx = entity.x * Config.zoom + this.camera.offsetX;
        const sy = entity.y * Config.zoom + this.camera.offsetY;
        return sx >= 0 && sx <= window.innerWidth &&
            sy >= 0 && sy <= window.innerHeight;
    }

    pickUpgrade(id) {
        const screen = document.getElementById('upgrade-screen');
        if (screen) screen.style.display = 'none';
        this._paused = false;

        const hab = HABILIDADES.find(h => h.id === id);
        if (!hab) return;

        if (hab.tipo === 'lmb') {
            // Limpiamos estado de cualquier LMB anterior
            for (const z of this.zombies) {
                z._orbitTargetX  = undefined;
                z._orbitTargetY  = undefined;
                z._bioBall       = false;
                z._comeTogether  = false;
                z._actualizarContorno && z._actualizarContorno(false);
            }
            if (this._bioball) {
                this._bioball._disolver();
                this._bioball = null;
            }
            if (this._comeTogether) {
                this._comeTogether._muerto = true;
                this.player._comeTogether  = false;
                if (this.player.sprite) this.player.sprite.tint = 0xffffff;
                this._comeTogether = null;
            }
            this._lmbUpgrade = id;

        } else {
            this._rmbUpgrade = id;
            const cdShot = document.getElementById('cd-shot');
            if (cdShot) cdShot.style.background = id === 'dagger' ? '#ffb74d' : id === 'necrotic' ? '#69f0ae' : '#33691e';
            if (id === 'necrotic') {
                this._necroticPulses = new NecroticPulses(this.player, this.worldContainer);
            } else {
                this._necroticPulses = null;
            }
        }
    }

    _mostrarUpgrade() {
        const { lmb, rmb } = elegirHabilidades(this._habilidadesUsadas);
        if (!lmb && !rmb) return; // no quedan habilidades

        if (lmb) this._habilidadesUsadas.push(lmb.id);
        if (rmb) this._habilidadesUsadas.push(rmb.id);

        // Armamos las cards dinámicamente
        const cards = document.getElementById('upgrade-cards');
        cards.innerHTML = '';

        const crearCard = (hab, color, colorAlpha) => {
            const div = document.createElement('div');
            div.style.cssText = `
                width:200px; padding:24px 20px;
                border:2px solid ${color};
                border-radius:12px;
                background:${colorAlpha};
                cursor:pointer; text-align:center;
            `;
            div.onmouseover = () => div.style.background = colorAlpha.replace('0.07', '0.18');
            div.onmouseout  = () => div.style.background = colorAlpha;
            div.onclick     = () => this.pickUpgrade(hab.id);
            div.innerHTML   = `
                <div style="font-size:11px;color:${color};letter-spacing:2px;margin-bottom:10px;">${hab.tipo.toUpperCase()}</div>
                <div style="font-size:15px;font-weight:bold;letter-spacing:1px;margin-bottom:12px;">${hab.nombre}</div>
                <div style="font-size:11px;color:#bbb;line-height:1.6;">${hab.desc}</div>
            `;
            return div;
        };

        if (lmb) cards.appendChild(crearCard(lmb, '#69f0ae', 'rgba(105,240,174,0.07)'));
        if (rmb) cards.appendChild(crearCard(rmb, '#ffb74d', 'rgba(255,183,77,0.07)'));

        this._paused = true;
        const screen = document.getElementById('upgrade-screen');
        if (screen) screen.style.display = 'flex';
    }

    _updateOrbit(delta) {
        // Agarramos hasta lmbMaxZombies en pantalla, los más cercanos al jugador
        const candidatos = this.zombies
            .filter(z => !z._dead && this._isOnScreen(z))
            .sort((a, b) =>
                Utils.distance(a.x, a.y, this.player.x, this.player.y) -
                Utils.distance(b.x, b.y, this.player.x, this.player.y)
            )
            .slice(0, Config.lmbMaxZombies);

        const enOrbita = new Set(candidatos);

        for (const z of this.zombies) {
            if (!enOrbita.has(z)) {
                // Este zombie no está en el set activo, limpiamos su target
                z._orbitTargetX = undefined;
                z._orbitTargetY = undefined;
                continue;
            }
            if (z._orbitAngle === undefined) {
                z._orbitAngle = Utils.angleTo(this.player.x, this.player.y, z.x, z.y);
            }
            z._orbitAngle  += Config.orbitSpeed * delta;
            z._orbitTargetX = this.player.x + Math.cos(z._orbitAngle) * Config.orbitRadius;
            z._orbitTargetY = this.player.y + Math.sin(z._orbitAngle) * Config.orbitRadius;
        }
    }

    _tickCombustion(delta) {
        if (this._combustionCD > 0) this._combustionCD -= delta;

        if (!this._combustionClick) return;
        this._combustionClick = false;

        if (this._combustionCD > 0) return;
        if (this._zombieProyectil && !this._zombieProyectil._muerto) return;

        let masCorto = null, distMin = Config.combustionPickRange;
        for (const z of this.zombies) {
            if (z._dead) continue;
            const d = Utils.distance(this.player.x, this.player.y, z.x, z.y);
            if (d < distMin) { distMin = d; masCorto = z; }
        }
        if (!masCorto) return;

        this._combustionCD = Config.combustionCooldown;
        const mx  = Mouse.worldX(this.camera.offsetX);
        const my  = Mouse.worldY(this.camera.offsetY);
        const dir = Utils.normalize(mx - this.player.x, my - this.player.y);
        this._zombieProyectil = new ZombieProyectil(masCorto, dir.x, dir.y, this.worldContainer);
    }
    
    _aplicarPunch(cursorX, cursorY) {
        aplicarPunch(
            this.player, this.humans, this.policia,
            this.zombies, this.worldContainer,
            cursorX, cursorY
        );
    }

    _tickWaves(delta) {
        this._waveTimer        -= delta;
        this._waveUpgradeTimer -= delta;

        const counter = document.getElementById('human-counter');

        // Timer de upgrade cada 3 minutos
        if (this._waveUpgradeTimer <= 0 && !this._paused && this.player.isZombie) {
            this._waveUpgradeTimer = Config.waveUpgradeEvery;
            this._mostrarUpgrade();
        }

        // Nueva wave cada minuto
        if (this._waveTimer <= 0) {
            this._waveNumber++;
            this._waveTimer = Config.waveDuration;

            if (this._waveNumber > Config.waveTotalWaves) {
                this._mostrarVictoria();
                return;
            }

            // Spawneamos enemigos con crecimiento
            const cantidad = Math.floor(
                Config.waveEnemyBase * (1 + Config.waveEnemyGrowth * (this._waveNumber - 1))
            );
            for (let i = 0; i < cantidad; i++) {
                const px = Utils.randomBetween(80, Config.worldWidth - 80);
                const py = Utils.randomBetween(80, Config.worldHeight - 80);
                const esSwat = Math.random() < Config.waveSwatRatio;
                this.policia.push(
                    esSwat
                        ? new Swat(px, py, this.worldContainer)
                        : new Policia(px, py, this.worldContainer)
                );
            }

            // Replenish de humanos hasta 250
            const vivos = this.humans.filter(h => !h._infected).length;
            const faltan = Config.waveHumanTarget - vivos;
            for (let i = 0; i < faltan; i++) {
                const hx = Utils.randomBetween(80, Config.worldWidth - 80);
                const hy = Utils.randomBetween(80, Config.worldHeight - 80);
                const esPeleador = Math.random() < Config.brawlerRatio;
                this.humans.push(
                    esPeleador
                        ? new Peleador(hx, hy, this.worldContainer)
                        : new Humano(hx, hy, this.worldContainer)
                );
            }
        }

        // HUD: wave y tiempo restante
        const segsRestantes = Math.ceil(this._waveTimer / 60);
        if (counter) counter.textContent =
            `WAVE ${this._waveNumber}/${Config.waveTotalWaves} — ${segsRestantes}s`;
    }

    _mostrarVictoria() {
        this.app.ticker.stop();
        const screen = document.getElementById('victory-screen');
        if (screen) screen.style.display = 'flex';
    }
};
