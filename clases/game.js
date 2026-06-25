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

        // Upgrades
        this._upgradeCount      = 0;
        this._paused            = false;
        this._lmbUpgrade        = null;
        this._rmbUpgrade        = null;
        this._daggerHits        = {};
        this._habilidadesUsadas = [];

        // Habilidades LMB
        this._combustionClick  = false;
        this._combustionCD     = 0;
        this._zombieProyectil  = null;
        this._bioball          = null;
        this._bioCD            = 0;
        this._comeTogether     = null;
        this._comeTogetherCD   = 0;

        // Habilidades RMB
        this._necroticPulses   = null;
        this._necroticOn       = false;   // toggle del necrotic

        // LMB básico overheat
        this._lmbOverheat      = Config.lmbOverheatMax;
        this._lmbOnCooldown    = false;
        this._lmbCooldownTimer = 0;

        // Timer de inicio
        this._startTimer   = Config.startTimerDuration;
        this._startTimerOn = true;

        // Waves
        this._waveMode         = false;
        this._waveNumber       = 0;
        this._waveTimer        = 0;
        this._waveUpgradeTimer = 0;
        this._gameMode         = null;

        this._hivemind        = null;
        this._hivemindCD      = 0;
        this._eliteCD         = 0;
        this._eliteInst       = null;

        setup().then(() => this.start());
    }

    // ── Inicio ────────────────────────────────────────────────────────────
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
            { alias: 'worldObjects', src: 'sprites/worldObjects.json' },
        ]);

        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);
        World.buildBackground(this.worldContainer);

        this._obstacles = [
            new Obstacle(Config.worldWidth * 0.15, Config.worldHeight * 0.2,  this.worldContainer, 'ruinedCar2.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.8,  Config.worldHeight * 0.15, this.worldContainer, 'ruinedCar1.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.25, Config.worldHeight * 0.75, this.worldContainer, 'ruinedCar2.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.75, Config.worldHeight * 0.8,  this.worldContainer, 'ruinedCar1.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.5,  Config.worldHeight * 0.2,  this.worldContainer, 'ruinedCar2.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.6,  Config.worldHeight * 0.65, this.worldContainer, 'ruinedCar1.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.10, Config.worldHeight * 0.50, this.worldContainer, 'ruinedCar3.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.90, Config.worldHeight * 0.50, this.worldContainer, 'ruinedCar3.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.50, Config.worldHeight * 0.85, this.worldContainer, 'ruinedCar3.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.35, Config.worldHeight * 0.40, this.worldContainer, 'ruinedCar4.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.65, Config.worldHeight * 0.35, this.worldContainer, 'ruinedCar4.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.45, Config.worldHeight * 0.55, this.worldContainer, 'ruinedCar4.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.10, Config.worldHeight * 0.85, this.worldContainer, 'ruinedCar5.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.90, Config.worldHeight * 0.85, this.worldContainer, 'ruinedCar5.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.20, Config.worldHeight * 0.35, this.worldContainer, 'ruinedCar5.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.85, Config.worldHeight * 0.30, this.worldContainer, 'ruinedCar6.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.30, Config.worldHeight * 0.60, this.worldContainer, 'ruinedCar6.png', Config.obstacleHitboxSize, 140, 90),
            new Obstacle(Config.worldWidth * 0.70, Config.worldHeight * 0.10, this.worldContainer, 'ruinedCar6.png', Config.obstacleHitboxSize, 140, 90)
        ];

        Input.init();
        Mouse.init();
        this.camera = new Camara(this.worldContainer);

        const spawnX = Config.worldWidth  / 2;
        const spawnY = Config.worldHeight / 2;
        this.player  = new Player(spawnX, spawnY, this.worldContainer);
        this.player._worldContainer = this.worldContainer;

        this._initListeners();
        this._spawnHumans(spawnX, spawnY);
        this._spawnPolicia();

        this.bulletsPolice = [];
        this._accumulator = 0;
        this.app.ticker.add(() => this._tickFixedStep());

        window.addEventListener('resize', () => this.app.renderer.resize(window.innerWidth, window.innerHeight));
        window.addEventListener('wheel',  e => this.camera.ajustarZoom(e.deltaY > 0 ? 1 : -1));
    }

    // ── Spawn helpers ─────────────────────────────────────────────────────
    _spawnHumans(spawnX, spawnY) {
        this.humans = [];
        for (let i = 0; i < Config.humanCount; i++) {
            let hx, hy, tries = 0;
            do {
                hx = Utils.randomBetween(80, Config.worldWidth  - 80);
                hy = Utils.randomBetween(80, Config.worldHeight - 80);
            } while (++tries < 30 && Utils.distance(hx, hy, spawnX, spawnY) < 200);
            this.humans.push(Math.random() < Config.brawlerRatio
                ? new Peleador(hx, hy, this.worldContainer)
                : new Humano(hx, hy, this.worldContainer)
            );
        }
    }

    _spawnPolicia() {
        this.policia = [];
        for (let i = 0; i < Config.policiaCount; i++) {
            let px, py, tries = 0;
            do {
                px = Utils.randomBetween(80, Config.worldWidth  - 80);
                py = Utils.randomBetween(80, Config.worldHeight - 80);
            } while (++tries < 30 && this.policia.some(c => Utils.distance(px, py, c.x, c.y) < 120));
            this.policia.push(Math.random() < Config.swatRatio
                ? new Swat(px, py, this.worldContainer)
                : new Policia(px, py, this.worldContainer)
            );
        }
    }

    // ── Listeners ─────────────────────────────────────────────────────────
    _initListeners() {
        window.addEventListener('mousedown', e => this._onMouseDown(e));
        window.addEventListener('keydown',   e => { if (e.code === 'Space') this.player.dash(); });
    }

    _onMouseDown(e) {
        if (this._paused) return; // bloqueamos input mientras hay un menú abierto

        const mx = Mouse.worldX(this.camera.offsetX);
        const my = Mouse.worldY(this.camera.offsetY);

        if (e.button === 0) {
            if (!this.player.isZombie) return;
            this._handleLMB(mx, my);
            return;
        }
        if (e.button !== 2) return;
        this._handleRMB(mx, my);
    }

    _handleLMB(mx, my) {
        if (this._lmbUpgrade === 'biomass') {
            if (!this._bioball && this._bioCD <= 0) {
                this._bioball = new BiomassBall(mx, my, this.zombies, this.worldContainer);
                this._bioCD   = Config.bioCooldown;
            }
        } else if (this._lmbUpgrade === 'combustion') {
            this._combustionClick = true;
        } else if (this._lmbUpgrade === 'cometogether') {
            if (!this._comeTogether && this._comeTogetherCD <= 0) {
                this._comeTogether = new ComeTogether(this.player, this.zombies, this.worldContainer);
            }
        } else if (this._lmbUpgrade === 'hivemind') {
            if (!this._hivemind && this._hivemindCD <= 0) {
                this._hivemind = new Hivemind(this.player, this.zombies, this.worldContainer);
            }
        }
    }

    _handleRMB(mx, my) {
        if (!this.player.isZombie) {
            this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
            this._startTimerOn = false;
            document.getElementById('start-timer').style.display          = 'none';
            document.getElementById('population-bar-wrap').style.display  = 'flex';
            if (this._waveMode) {
                document.getElementById('wave-counter').style.display = 'block';
                this._waveTimer = Config.waveDuration;
            }
            return;
        }
    
        if (this._rmbUpgrade === 'elite') {
            if (this._eliteCD <= 0) {
                this._eliteInst = new EliteReinforcement(this.player, this.zombies, this.worldContainer);
                this._eliteCD   = Config.eliteCooldown;
            }
            return;
        }
        if (this._rmbUpgrade === 'necrotic') {
            this._necroticOn = !this._necroticOn;
            return;
        }

        if (this.player._bulletCooldown > 0 || this.player._comeTogether) return;

        this.player.attack();
        const angle = Utils.angleTo(this.player.x, this.player.y, mx, my);

        if (this._rmbUpgrade === 'dagger') {
            this.player._bulletCooldown = Config.daggerCooldown;
            for (const a of [angle - Config.daggerSpreadAngle, angle, angle + Config.daggerSpreadAngle]) {
                this.bullets.push(new BalaDagger(this.player.x, this.player.y, a, this.worldContainer, this._daggerHits));
            }
        } else if (this._rmbUpgrade === 'pit') {
            this.player._bulletCooldown = Config.playerBulletCooldown;
            this.bullets.push(new BalaPit(this.player.x, this.player.y, angle, this.worldContainer));
        } else {
            this.player._bulletCooldown = Config.playerBulletCooldown;
            this.bullets.push(new Bala(this.player.x, this.player.y, angle, this.worldContainer));
        }
    }
    
    // ── Fixed timestep ───────────────────────────────────────────────────
    _tickFixedStep() {
        let frameTime = this.app.ticker.deltaMS;
        frameTime = Math.min(frameTime, Config.maxFrameTimeMS);
        this._accumulator += frameTime;

        let pasos = 0;
        while (this._accumulator >= Config.fixedStepMS && pasos < Config.maxStepsPerFrame) {
            this._tick(1);
            this._accumulator -= Config.fixedStepMS;
            pasos++;
        }
    }

    // ── Tick principal ────────────────────────────────────────────────────

    _tick(delta) {
        if (this._paused || !this._gameMode) return;

        this._tickStartTimer(delta);
        this.player.update(delta);

        if (this.player.dead) {
            this.app.ticker.stop();
            document.getElementById('death-screen').style.display = 'flex';
            return;
        }

        for (const h of this.humans) h.update(this.humans, this.player, this.zombies, delta);

        const { lmbActive, lmbTargetX, lmbTargetY } = this._tickLMB(delta);
        for (const z of this.zombies) {
            const controlled = lmbActive && this._isOnScreen(z);
            z.update(this.zombies, this.humans, this.policia, delta, this.worldContainer, controlled, lmbTargetX, lmbTargetY);
        }
        
        this._tickBullets();
        this._tickPolicia(delta);
        this._tickBulletsPolice();
        this._cleanDeadZombies();

        this.camera.followTarget(this.player.x, this.player.y);
        this._tickHUD(delta);
        this._tickRMBAbilities(delta);
        if (this._waveMode) this._tickWaves(delta);

        // Charcos
        for (let i = charcos.length - 1; i >= 0; i--) {
            charcos[i].update(delta, this.humans, this.policia, this.zombies);
            if (charcos[i]._muerto) charcos.splice(i, 1);
        }

        // Zombie proyectil
        if (this._zombieProyectil && !this._zombieProyectil._muerto) {
            this._zombieProyectil.update(delta, this.humans, this.policia, this.zombies, this.worldContainer);
        }
    }

    // ── Sub-ticks ─────────────────────────────────────────────────────────
    _tickStartTimer(delta) {
        if (!this._startTimerOn) return;
        this._startTimer -= delta;
        const el   = document.getElementById('start-timer');
        if (el) el.textContent = `TRANSFORMING IN: ${Math.ceil(this._startTimer / 60)}s`;
            if (this._startTimer <= 0) {
                this._startTimerOn = false;
                if (el) el.style.display = 'none';
                document.getElementById('population-bar-wrap').style.display = 'flex';
                if (this._waveMode) {
                    document.getElementById('wave-counter').style.display = 'block';
                    this._waveTimer = Config.waveDuration; // arranca recién ahora
                }
                if (!this.player.isZombie) this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
            }
    }

    _tickLMB(delta) {
        const lmbTargetX = Mouse.worldX(this.camera.offsetX);
        const lmbTargetY = Mouse.worldY(this.camera.offsetY);
        let lmbActive = false;

        // Barra LMB
        const cdLmb = document.getElementById('cd-lmb');
        if (cdLmb) this._actualizarBarraLMB(cdLmb, delta);

        // Overheat básico
        if (!this._lmbUpgrade && this.player.isZombie) {
            if (this._lmbOnCooldown) {
                this._lmbCooldownTimer -= delta;
                if (this._lmbCooldownTimer <= 0) {
                    this._lmbOnCooldown = false;
                    this._lmbOverheat   = Config.lmbOverheatMax;
                }
            } else if (Mouse.leftHeld && this._lmbOverheat > 0) {
                lmbActive = true;
                this._lmbOverheat -= delta;
                if (this._lmbOverheat <= 0) {
                    this._lmbOverheat      = 0;
                    this._lmbOnCooldown    = true;
                    this._lmbCooldownTimer = Config.lmbOverheatCooldown;
                    lmbActive = false;
                }
            } else if (!Mouse.leftHeld) {
                this._lmbOverheat = Math.min(Config.lmbOverheatMax, this._lmbOverheat + delta * Config.lmbRechargeRate);
            }
        }

        // Habilidades LMB activas
        if (this._lmbUpgrade === 'combustion') this._tickCombustion(delta);

        if (this._lmbUpgrade === 'cometogether') {
            if (this._comeTogether && !this._comeTogether._muerto) {
                this._comeTogether.update(delta, this.humans, this.policia);
            } else if (this._comeTogether?._muerto) {
                this._comeTogetherCD = Config.comeTogetherDuration * 2;
                this._comeTogether   = null;
            }
            if (this._comeTogetherCD > 0) this._comeTogetherCD -= delta;
        }

        if (this._lmbUpgrade === 'biomass') {
            if (this._bioball && !this._bioball._muerto) {
                this._bioball.update(delta, this.humans, this.policia, this.zombies, this.worldContainer);
            } else if (this._bioball?._muerto) {
                this._bioball = null;
            }
            if (this._bioCD > 0) this._bioCD -= delta;
        }

        if (this._lmbUpgrade === 'hivemind') {
            if (this._hivemind && !this._hivemind._muerto) {
                this._hivemind.update(delta);
            } else if (this._hivemind?._muerto) {
                if (this._hivemindCD <= 0) this._hivemindCD = Config.hivemindCooldown;
                this._hivemind = null;
            }
            if (this._hivemindCD > 0) this._hivemindCD -= delta;
        }

        return { lmbActive, lmbTargetX, lmbTargetY };
    }

    _tickBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(this.humans, this.worldContainer, this.zombies);
            if (this.bullets[i].dead) { this.bullets[i].destroy(); this.bullets.splice(i, 1); }
        }
    }

    _tickPolicia(delta) {
        for (const p of this.policia) p.update(this.zombies, this.humans, this.policia, this.player, this.bulletsPolice, this.worldContainer, delta);
        for (let i = this.policia.length - 1; i >= 0; i--) {
            if (this.policia[i]._dead) { this.worldContainer.removeChild(this.policia[i].container); this.policia.splice(i, 1); }
        }
    }

    _tickBulletsPolice() {
        for (let i = this.bulletsPolice.length - 1; i >= 0; i--) {
            this.bulletsPolice[i].update(this.zombies, this.player);
            if (this.bulletsPolice[i].dead) { this.bulletsPolice[i].destroy(); this.bulletsPolice.splice(i, 1); }
        }
    }

    _cleanDeadZombies() {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const z = this.zombies[i];
            if (z._dead && !z._bioBall) { this.worldContainer.removeChild(z.container); this.zombies.splice(i, 1); }
        }
    }
    _tickHUD(delta) {
        // ── Barra de población ────────────────────────────────────────────
        const numHumans  = this.humans.filter(h => !h._infected).length;
        const numZombies = this.zombies.length;
        const numForces  = this.policia.length;
        const total      = numHumans + numZombies + numForces;

        if (total > 0) {
            document.getElementById('pop-humans').style.width  = (numHumans  / total * 100) + '%';
            document.getElementById('pop-zombies').style.width = (numZombies / total * 100) + '%';
            document.getElementById('pop-forces').style.width  = (numForces  / total * 100) + '%';
        }
        document.getElementById('pop-count-humans').textContent  = Config.labelPopHumans  + ' ' + numHumans;
        document.getElementById('pop-count-zombies').textContent = Config.labelPopZombies + ' ' + numZombies;
        document.getElementById('pop-count-forces').textContent  = Config.labelPopForces  + ' ' + numForces;

        // ── Colores desde config ──────────────────────────────────────────
        document.getElementById('pop-humans').style.background  = Config.colorPopHumans;
        document.getElementById('pop-zombies').style.background = Config.colorPopZombies;
        document.getElementById('pop-forces').style.background  = Config.colorPopForces;
        document.getElementById('pop-count-humans').style.color  = Config.colorPopHumans;
        document.getElementById('pop-count-zombies').style.color = Config.colorPopZombies;
        document.getElementById('pop-count-forces').style.color  = Config.colorPopForces;

        // ── Labels desde config ───────────────────────────────────────────
        document.getElementById('label-health').textContent = Config.labelHealth;
        document.getElementById('label-xp').textContent     = Config.labelXP;

        // ── XP bar ────────────────────────────────────────────────────────
        const infected   = this.humans.filter(h => h._infected).length;
        const xpLevels   = [Config.xpLevel1, Config.xpLevel2, Config.xpLevel3];
        const xpCurrent  = xpLevels[Math.min(this._upgradeCount, xpLevels.length - 1)];
        const xpPrev     = this._upgradeCount === 0 ? 0
                         : this._upgradeCount === 1 ? Config.xpLevel1
                         : Config.xpLevel2;
        const xpPct      = this._upgradeCount >= xpLevels.length ? 100
                         : Math.min(100, ((infected - xpPrev) / (xpCurrent - xpPrev)) * 100);

        const xpBar = document.getElementById('xp-bar');
        if (xpBar) {
            xpBar.style.width      = Math.max(0, xpPct) + '%';
            xpBar.style.background = Config.colorXPBar;
        }

        // ── Circles cooldown ──────────────────────────────────────────────
        this._actualizarCirculos();

        if (this._waveMode) {
            const counter = document.getElementById('wave-counter');
            if (counter) counter.textContent =
                `WAVE ${this._waveNumber}/${Config.waveTotalWaves} — ${Math.ceil(this._waveTimer / 60)}s`;
            return;
        }

        // ── Modo normal: upgrades y victoria ─────────────────────────────
        const thresholds = [Config.xpLevel1, Config.xpLevel2, Config.xpLevel3];
        if (this.player.isZombie && !this._paused) {
            if (this._upgradeCount < thresholds.length && infected >= thresholds[this._upgradeCount]) {
                this._upgradeCount++;
                this._mostrarUpgrade();
            }
        }

        if (this.player.isZombie &&
            this.humans.every(h => h._infected) &&
            this.policia.length === 0) {
            this._mostrarVictoria();
        }
    }

    _actualizarCirculos() {
        const r      = Config.hudCooldownRadius * 0.83;
        const circum = 2 * Math.PI * r;

        // ── LMB ──────────────────────────────────────────────────────────
        const arcLMB   = document.getElementById('arc-lmb');
        const lblLMB   = document.getElementById('label-lmb-ability');
        const lblLMBc  = document.getElementById('label-lmb-center');
        if (arcLMB) {
            arcLMB.style.stroke = Config.colorLMB;
            let pctLMB = 1;
            if (!this._lmbUpgrade) {
                // Overheat básico
                if (this._lmbOnCooldown) {
                    pctLMB = 1 - (this._lmbCooldownTimer / Config.lmbOverheatCooldown);
                } else {
                    pctLMB = this._lmbOverheat / Config.lmbOverheatMax;
                }
            } else if (this._lmbUpgrade === 'biomass') {
                pctLMB = this._bioCD > 0 ? 1 - (this._bioCD / Config.bioCooldown) : 1;
            } else if (this._lmbUpgrade === 'combustion') {
                pctLMB = this._combustionCD > 0 ? 1 - (this._combustionCD / Config.combustionCooldown) : 1;
            } else if (this._lmbUpgrade === 'cometogether') {
                const cdMax = Config.comeTogetherDuration * 2;
                pctLMB = this._comeTogetherCD > 0 ? 1 - (this._comeTogetherCD / cdMax) : 1;
            } else if (this._lmbUpgrade === 'hivemind') {
                pctLMB = this._hivemindCD > 0 ? 1 - (this._hivemindCD / Config.hivemindCooldown) : 1;
            }
            arcLMB.style.strokeDashoffset = (circum * (1 - Math.max(0, Math.min(1, pctLMB))));

            if (lblLMB) lblLMB.textContent = this._lmbUpgrade
                ? (HABILIDADES.find(h => h.id === this._lmbUpgrade)?.nombre || 'Rally of Death')
                : 'Rally of Death';
            if (lblLMBc) lblLMBc.textContent = Config.labelLMB;
        }

        // ── RMB ──────────────────────────────────────────────────────────
        const arcRMB  = document.getElementById('arc-rmb');
        const lblRMB  = document.getElementById('label-rmb-ability');
        const lblRMBc = document.getElementById('label-rmb-center');
        if (arcRMB) {
            arcRMB.style.stroke = Config.colorRMB;
            let pctRMB = 1;
            // NUEVO
            if (this._rmbUpgrade === 'necrotic') {
                pctRMB = 1;
                // Cambiamos el color según el estado ON/OFF
                arcRMB.style.stroke = this._necroticOn ? Config.colorRMB : 'rgba(255,255,255,0.25)';
            } else if (this.player._bulletCooldown > 0) {
                const shotMax = this._rmbUpgrade === 'dagger' ? Config.daggerCooldown : Config.playerBulletCooldown;
                pctRMB = 1 - (this.player._bulletCooldown / shotMax);
            } else if (this._rmbUpgrade === 'elite') {
                pctRMB = this._eliteCD > 0 ? 1 - (this._eliteCD / Config.eliteCooldown) : 1;
            }
            arcRMB.style.strokeDashoffset = (circum * (1 - Math.max(0, Math.min(1, pctRMB)))).toFixed(2);
            if (lblRMB) lblRMB.textContent = this._rmbUpgrade
                ? (HABILIDADES.find(h => h.id === this._rmbUpgrade)?.nombre || Config.labelRMB)
                : Config.labelRMB;
            if (lblRMB) lblRMB.textContent = this._rmbUpgrade
                ? (HABILIDADES.find(h => h.id === this._rmbUpgrade)?.nombre || 'Infecting Spit')
                : 'Infecting Spit';
            if (lblRMBc) lblRMBc.textContent = Config.labelRMB;
            
        }

        const lblDash  = document.getElementById('label-dash-ability');
        const lblDashC = document.getElementById('label-dash-center');
        if (lblDash)  lblDash.textContent  = Config.labelDash;
        if (lblDashC) lblDashC.textContent = 'SPACE';
    }

    _tickRMBAbilities(delta) {
        if (this._rmbUpgrade === 'elite' && this._eliteInst) {
            const terminado = this._eliteInst.update(delta, this.zombies);
            if (terminado) this._eliteInst = null;
        }
        if (this._eliteCD > 0) this._eliteCD -= delta;

        if (this._rmbUpgrade === 'necrotic' && this.player.isZombie) {
            if (!this._necroticPulses) this._necroticPulses = new NecroticPulses(this.player, this.worldContainer);
            if (this._necroticOn) {
                this._necroticPulses.update(delta, this.humans, this.policia, this.zombies);
            }
            // Pasamos el estado al player para que aplique los efectos
            this.player._necroticOn = this._necroticOn;
        } else {
            this.player._necroticOn = false;
        }
    }

    _actualizarBarraLMB(el, delta) {
        if (!this._lmbUpgrade) {
            const pct = this._lmbOnCooldown
                ? 1 - (this._lmbCooldownTimer / Config.lmbOverheatCooldown)
                : this._lmbOverheat / Config.lmbOverheatMax;
            el.style.height     = (pct * 100) + '%';
            el.style.background = this._lmbOnCooldown ? '#ef5350' : pct > 0.3 ? '#69f0ae' : '#ffb74d';
        } else if (this._lmbUpgrade === 'biomass') {
            el.style.height     = ((1 - Math.max(0, this._bioCD) / Config.bioCooldown) * 100) + '%';
            el.style.background = '#69f0ae';
        } else if (this._lmbUpgrade === 'combustion') {
            el.style.height     = ((1 - Math.max(0, this._combustionCD) / Config.combustionCooldown) * 100) + '%';
            el.style.background = '#ff7043';
        } else if (this._lmbUpgrade === 'cometogether') {
            const cdMax = Config.comeTogetherDuration * 2;
            el.style.height     = ((1 - Math.max(0, this._comeTogetherCD) / cdMax) * 100) + '%';
            el.style.background = '#69f0ae';
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    _isOnScreen(entity) {
        const sx = entity.x * Config.zoom + this.camera.offsetX;
        const sy = entity.y * Config.zoom + this.camera.offsetY;
        return sx >= 0 && sx <= window.innerWidth && sy >= 0 && sy <= window.innerHeight;
    }

    _aplicarPunch(mx, my) {
        aplicarPunch(this.player, this.humans, this.policia, this.zombies, this.worldContainer, mx, my);
    }

    // ── Upgrades ──────────────────────────────────────────────────────────
    pickUpgrade(id) {
        document.getElementById('upgrade-screen').style.display = 'none';
        this._paused = false;

        const hab = HABILIDADES.find(h => h.id === id);
        if (!hab) return;

        if (hab.tipo === 'lmb') {
            // Limpiamos estado LMB anterior
            for (const z of this.zombies) {
                z._orbitTargetX = undefined;
                z._orbitTargetY = undefined;
                z._bioBall      = false;
                z._comeTogether = false;
                z._actualizarContorno?.(false);
            }
            if (this._bioball) {
                this._bioball._disolver();
                this._bioball = null;
            }
            if (this._hivemind) {
                this._hivemind._terminar();
                this._hivemind = null;
            }
            if (this._comeTogether) {
                this._comeTogether._muerto = true;
                this.player._comeTogether  = false;
                if (this.player.sprite) this.player.sprite.tint = 0xffffff;
                this._comeTogether = null;
            }
            this._lmbUpgrade = id;
        } else {
            this._rmbUpgrade     = id;
            this._necroticPulses = id === 'necrotic'
                ? new NecroticPulses(this.player, this.worldContainer)
                : null;
            const cdShot = document.getElementById('cd-shot');
            if (cdShot) cdShot.style.background = id === 'dagger' ? '#ffb74d' : id === 'necrotic' ? '#69f0ae' : '#33691e';
        }
    }

    _mostrarUpgrade() {
        const { lmb, rmb } = elegirHabilidades(this._habilidadesUsadas);
        if (!lmb && !rmb) return;
        if (lmb) this._habilidadesUsadas.push(lmb.id);
        if (rmb) this._habilidadesUsadas.push(rmb.id);

        // Spawn de zombies post-upgrade alrededor del jugador
        if (this.player.isZombie) {
            for (let i = 0; i < Config.upgradeZombieSpawn; i++) {
                const angle  = Utils.randomAngle();
                const dist   = Utils.randomBetween(80, 160);
                const zx     = Utils.clamp(this.player.x + Math.cos(angle) * dist, 16, Config.worldWidth - 16);
                const zy     = Utils.clamp(this.player.y + Math.sin(angle) * dist, 16, Config.worldHeight - 16);
                this.zombies.push(new Zombie(zx, zy, this.worldContainer));
            }

            // Cap de zombies en waves
            if (this._waveMode && this.zombies.length > Config.upgradeZombieCap) {
                const excess = this.zombies.length - Config.upgradeZombieCap;
                for (let i = 0; i < excess; i++) {
                    const z = this.zombies.pop();
                    if (z) this.worldContainer.removeChild(z.container);
                }
            }

            // Reposición de enemigos en modo normal
            if (!this._waveMode) {
                const isLast   = this._upgradeCount >= 3;
                const target   = isLast ? Config.upgradeEnemyTargetFinal : Config.upgradeEnemyTarget;
                const faltan   = target - this.policia.length;
                for (let i = 0; i < faltan; i++) {
                    let px, py, tries = 0;
                    do {
                        px = Utils.randomBetween(80, Config.worldWidth - 80);
                        py = Utils.randomBetween(80, Config.worldHeight - 80);
                    } while (++tries < 20 && Utils.distance(px, py, this.player.x, this.player.y) < 300);
                    this.policia.push(Math.random() < Config.waveSwatRatio
                        ? new Swat(px, py, this.worldContainer)
                        : new Policia(px, py, this.worldContainer)
                    );
                }
            }
        }

        const cards = document.getElementById('upgrade-cards');
        cards.innerHTML = '';

        const crearCard = (hab, color, alpha) => {
            const div = document.createElement('div');
            div.style.cssText = `
                width:${Config.upgradeCardWidth}px;
                padding:32px 28px;
                border:2px solid ${color};
                border-radius:14px;
                background:rgba(${alpha});
                cursor:pointer;
                text-align:center;
            `;
            div.onmouseover = () => div.style.background = `rgba(${alpha.replace('0.07', '0.18')})`;
            div.onmouseout  = () => div.style.background = `rgba(${alpha})`;
            div.onclick     = () => this.pickUpgrade(hab.id);
            div.innerHTML   = `
                <div style="font-size:${Config.upgradeCardFontType}px;color:${color};letter-spacing:2px;margin-bottom:10px;">${hab.tipo.toUpperCase()}</div>
                <div style="font-size:${Config.upgradeCardFontTitle}px;font-weight:bold;letter-spacing:1px;margin-bottom:12px;">${hab.nombre}</div>
                <div style="font-size:${Config.upgradeCardFontDesc}px;color:#bbb;line-height:1.6;">${hab.desc}</div>`;
            return div;
        };

        if (lmb) cards.appendChild(crearCard(lmb, '#ffee00', '255,238,0,0.07'));
        if (rmb) cards.appendChild(crearCard(rmb, '#91ff00', '145,255,0,0.07'));

        this._paused = true;
        const screen = document.getElementById('upgrade-screen');
        screen.style.display = 'flex';
    }

    _mostrarVictoria() {
        this.app.ticker.stop();
        document.getElementById('victory-screen').style.display = 'flex';
    }

    // ── Combustion ────────────────────────────────────────────────────────

    _tickCombustion(delta) {
        if (this._combustionCD > 0) this._combustionCD -= delta;
        if (!this._combustionClick) return;

        // Solo consumimos el click si podemos actuar
        if (this._combustionCD > 0 || (this._zombieProyectil && !this._zombieProyectil._muerto)) {
            this._combustionClick = false;
            return;
        }

        this._combustionClick = false;

        const masCorto = this.zombies
            .filter(z => !z._dead && !z._bioBall && !z._comeTogether)
            .reduce((best, z) => {
                const d = Utils.distance(this.player.x, this.player.y, z.x, z.y);
                return d < Config.combustionPickRange && (!best || d < best.d) ? { z, d } : best;
            }, null)?.z;

        if (!masCorto) return;
        this._combustionCD = Config.combustionCooldown;
        const mx  = Mouse.worldX(this.camera.offsetX);
        const my  = Mouse.worldY(this.camera.offsetY);
        const dir = Utils.normalize(mx - this.player.x, my - this.player.y);
        this._zombieProyectil = new ZombieProyectil(masCorto, dir.x, dir.y, this.worldContainer);
    }

    _tickWaves(delta) {
        if (this._waveTimer === null) return; // esperando que termine la transformación

        if (this._waveNumber >= Config.waveTotalWaves) {
            this._checarVictoriaWaves();
            const counter = document.getElementById('wave-counter');
            if (counter) counter.textContent = `WAVE ${this._waveNumber}/${Config.waveTotalWaves} — FINAL`;
            return;
        }

        this._waveTimer        -= delta;
        this._waveUpgradeTimer -= delta;

        if (this._waveUpgradeTimer <= 0 && !this._paused && this.player.isZombie) {
            this._waveUpgradeTimer = Config.waveUpgradeEvery;
            this._mostrarUpgrade();
        }

        if (this._waveTimer <= 0) {
            this._waveNumber++;
            this._waveTimer = Config.waveDuration;

            const cantidad = Math.floor(Config.waveEnemyBase * (1 + Config.waveEnemyGrowth * (this._waveNumber - 1)));
            for (let i = 0; i < cantidad; i++) {
                const px = Utils.randomBetween(80, Config.worldWidth - 80);
                const py = Utils.randomBetween(80, Config.worldHeight - 80);
                this.policia.push(Math.random() < Config.waveSwatRatio
                    ? new Swat(px, py, this.worldContainer)
                    : new Policia(px, py, this.worldContainer)
                );
            }

            const faltan = Config.waveHumanTarget - this.humans.filter(h => !h._infected).length;
            for (let i = 0; i < faltan; i++) {
                const hx = Utils.randomBetween(80, Config.worldWidth - 80);
                const hy = Utils.randomBetween(80, Config.worldHeight - 80);
                this.humans.push(Math.random() < Config.brawlerRatio
                    ? new Peleador(hx, hy, this.worldContainer)
                    : new Humano(hx, hy, this.worldContainer)
                );
            }
        }

        this._checarVictoriaWaves();

        const counter = document.getElementById('wave-counter');
        if (counter) counter.textContent =
            `WAVE ${this._waveNumber}/${Config.waveTotalWaves} — ${Math.ceil(this._waveTimer / 60)}s`;
    }

    _checarVictoriaWaves() {
        if (this._waveNumber >= Config.waveTotalWaves &&
            this.player.isZombie &&
            this.humans.every(h => h._infected) &&
            this.policia.length === 0) {
            this._mostrarVictoria();
        }
    }
}