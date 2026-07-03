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

        this._matchTimer    = 0;       // tiempo transcurrido en frames
        this._matchStarted  = false;   // empieza a contar cuando el jugador se transforma

        // Bonificaciones permanentes activas
        this._bonusSpeed      = false;
        this._bonusCooldown   = false;
        this._bonusShield     = false;
        this._bonusPushImmune = false;
        this._bonusPsyop      = false;
        this._bonusReflect    = false;

        setup().then(() => this.start());
    }

    // ── Inicio ────────────────────────────────────────────────────────────
    async start() {
        await SoundManager.init();
        await SoundManager.loadAll({
            menuMusic:      'sounds/menuMusic.wav',
            matchMusic:     'sounds/matchMusic.wav',
            victory:        'sounds/victory.mp3',
            defeat:         'sounds/defeat.mp3',
            playerShot:     'sounds/playerShot.wav',
            playerDash:     'sounds/playerDash.wav',
            playerChannel:  'sounds/playerChannel.wav',
            transformation: 'sounds/transformation.wav',
            buffedZombies:  'sounds/buffedZombies.wav',
            playerHit:      'sounds/playerHit.wav',
            explosion:      'sounds/explosion.wav',
            venomousPit:    'sounds/venomousPit.wav',
            policeShot:     'sounds/policeShot.wav',
            swatShot:       'sounds/swatShot.wav',
            brawlerStrike:  'sounds/brawlerStrike.wav',
        });
        if (SoundManager._ctx?.state === 'running') {
            SoundManager.playMusic('menuMusic', 0);
        }
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
                SoundManager.play('playerChannel');
            }
        } else if (this._lmbUpgrade === 'hivemind') {
            if (!this._hivemind && this._hivemindCD <= 0) {
                this._hivemind = new Hivemind(this.player, this.zombies, this.worldContainer);
                SoundManager.play('playerChannel');
            }
        }
    }

    _handleRMB(mx, my) {
        if (!this.player.isZombie) {
            this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
            SoundManager.play('transformation');
            SoundManager.stopMusic();
            SoundManager.playMusic('matchMusic', 3000);
            this._matchStarted = true;
            if (!this._waveMode) {
                document.getElementById('match-timer').style.display = 'block';
            }
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
        SoundManager.play('playerShot');
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

        if (this._matchStarted && !this._paused) {
            this._matchTimer += delta;
        }

        this._tickStartTimer(delta);
        this.player.update(delta);

        if (this.player.dead) {
            this.app.ticker.stop();
            SoundManager.stopMusic();
            SoundManager.play('defeat');
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
                    this._waveTimer = Config.waveDuration;
                } else {
                    document.getElementById('match-timer').style.display = 'block';
                }
                if (!this.player.isZombie) this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
                SoundManager.play('transformation');
                SoundManager.stopMusic();
                SoundManager.playMusic('matchMusic', 3000);
                this._matchStarted = true;
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
                SoundManager.stopLoop('_hordeSource');
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

        if (!this._waveMode && this._matchStarted) {
            const el = document.getElementById('match-timer');
            if (el) {
                const seg = Math.floor(this._matchTimer / 60);
                const min = Math.floor(seg / 60);
                const s   = seg % 60;
                el.textContent = `TIME: ${min}:${s.toString().padStart(2, '0')}`;
            }
        }

        if (this.player.isZombie &&
            this.humans.every(h => h._infected) &&
            this.policia.length === 0) {
            this._mostrarVictoria();
        }
    }

    _actualizarCirculos() {
        const cdMult = this._bonusCooldown ? Config.bonusCooldownMult : 1;
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
                pctLMB = this._bioCD > 0 ? 1 - (this._bioCD / (Config.bioCooldown * cdMult)) : 1;
            } else if (this._lmbUpgrade === 'combustion') {
                pctLMB = this._combustionCD > 0 ? 1 - (this._combustionCD / (Config.combustionCooldown * cdMult)) : 1;
            } else if (this._lmbUpgrade === 'cometogether') {
                const cdMax = Config.comeTogetherDuration * 2 * cdMult;
                pctLMB = this._comeTogetherCD > 0 ? 1 - (this._comeTogetherCD / cdMax) : 1;
            } else if (this._lmbUpgrade === 'hivemind') {
                pctLMB = this._hivemindCD > 0 ? 1 - (this._hivemindCD / (Config.hivemindCooldown * cdMult)) : 1;
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
             if (this._rmbUpgrade === 'necrotic') {
                pctRMB = 1;
            } else if (this.player._bulletCooldown > 0) {
                const shotMax = this._rmbUpgrade === 'dagger'
                    ? Config.daggerCooldown * cdMult
                    : Config.playerBulletCooldown * cdMult;
                pctRMB = 1 - (this.player._bulletCooldown / shotMax);
            } else if (this._rmbUpgrade === 'elite') {
                pctRMB = this._eliteCD > 0 ? 1 - (this._eliteCD / (Config.eliteCooldown * cdMult)) : 1;
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
        if (!entity) return false;
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

        // En waves, la música arranca al confirmar la primera habilidad
        if (this._waveMode && this._upgradeCount === 0 && this.player.isZombie) {
            SoundManager.stopMusic();
            SoundManager.playMusic('matchMusic', 3000);
        }

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
        const BONIFICACIONES = [
            { id: 'speed',      nombre: 'Adrenaline Rush',      desc: '+50% de velocidad de movimiento permanente.' },
            { id: 'reflect',    nombre: 'Carrion Bullets',      desc: 'Las balas al atravesarte se convierten en proyectiles zombies. Recibes 25% menos daño.' },
            { id: 'heal',       nombre: 'Second Wind',          desc: 'Restaura la vida del jugador al máximo.' },
            { id: 'cooldown',   nombre: 'Genetic Enhancement',  desc: 'Reduce el cooldown de todas las habilidades un 25% permanentemente.' },
            { id: 'pushimmune', nombre: 'Immovable Object',     desc: 'Inmunidad total al empuje de balas y ataques melee.' },
            { id: 'psyop',      nombre: 'Cognitive Psyop',      desc: 'Los humanos te reconocen como uno de los suyos. No huyen de ti ni te atacan.' },
            { id: 'shield',     nombre: 'Rotting Armor',        desc: 'Reduce el daño recibido un 50% permanentemente.' },
        ];
        const bonDisp = BONIFICACIONES.filter(b => { 
            if (b.id === 'reflect' && this._bonusReflect) return false;
            if (b.id === 'heal'     && this.player.health >= Config.playerMaxHealth) return false;
            if (b.id === 'speed'    && this._bonusSpeed)    return false;
            if (b.id === 'cooldown' && this._bonusCooldown) return false;
            if (b.id === 'shield'      && this._bonusShield)      return false;
            if (b.id === 'pushimmune'  && this._bonusPushImmune)  return false;
            if (b.id === 'psyop'       && this._bonusPsyop)       return false;
            return true;
        });
        const bonElegido = bonDisp[Math.floor(Math.random() * bonDisp.length)] || null;
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
        cards.style.alignItems = 'center';
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
                align-self:stretch;
            `;
            div.onmouseover = () => div.style.background = `rgba(${alpha.split(',').slice(0,3).join(',')},0.25)`;
            div.onmouseout  = () => div.style.background = `rgba(${alpha})`;
            div.onclick     = () => this.pickUpgrade(hab.id);
            div.innerHTML   = `
                <div style="font-size:${Config.upgradeCardFontType}px;color:${color};letter-spacing:2px;margin-bottom:10px;">${hab.tipo === 'lmb' ? 'LEFT CLICK' : 'RIGHT CLICK'}</div>
                <div style="font-size:${Config.upgradeCardFontTitle}px;font-weight:bold;color:#ffffff;letter-spacing:1px;margin-bottom:12px;">${hab.nombre}</div>
                <div style="font-size:${Config.upgradeCardFontDesc}px;color:#fff;line-height:1.6;">${hab.desc}</div>`;
            return div;
        };

        if (lmb) cards.appendChild(crearCard(lmb, '#ffffff', '200,200,200,0.07'));
        if (bonElegido) {
            const bonDiv = document.createElement('div');
            bonDiv.style.cssText = `
                width:${Math.floor(Config.upgradeCardWidth * 0.75)}px;
                padding:16px 18px;
                border:2px solid #fffb00;
                border-radius:12px;
                background:rgba(255,251,0,0.07);
                cursor:pointer;
                text-align:center;
                align-self:center;
            `;
            bonDiv.onmouseover = () => bonDiv.style.background = 'rgba(255,251,0,0.2)';
            bonDiv.onmouseout  = () => bonDiv.style.background = 'rgba(255,251,0,0.07)';
            bonDiv.onclick     = () => this._aplicarBonificacion(bonElegido.id);
            bonDiv.innerHTML   = `
                <div style="font-size:${Config.upgradeCardFontType}px;color:#fffb00;letter-spacing:2px;margin-bottom:8px;">BONUS</div>
                <div style="font-size:${Config.upgradeCardFontTitle}px;font-weight:bold;color:#ffffff;letter-spacing:1px;margin-bottom:10px;">${bonElegido.nombre}</div>
                <div style="font-size:${Config.upgradeCardFontDesc}px;color:#bbb;line-height:1.5;">${bonElegido.desc}</div>
            `;
            cards.appendChild(bonDiv);
        }
        if (rmb) cards.appendChild(crearCard(rmb, '#91ff00', '145,255,0,0.07'));


        this._paused = true;
        const screen = document.getElementById('upgrade-screen');
        screen.style.display = 'flex';
    }

    _aplicarBonificacion(id) {
        document.getElementById('upgrade-screen').style.display = 'none';
        this._paused = false;

        switch (id) {
            case 'reflect':
                this._bonusReflect = true;
                break;
            case 'speed':
                this._bonusSpeed = true;
                break;
            case 'heal':
                this.player.health = Config.playerMaxHealth;
                this.player._actualizarBarraSalud();
                break;
            case 'cooldown':
                this._bonusCooldown = true;
                break;
            case 'pushimmune':
                this._bonusPushImmune = true;
                break;
            case 'psyop':
                this._bonusPsyop = true;
                break;
            case 'shield':
                this._bonusShield = true;
                break;
            }
            
        }

    _mostrarVictoria() {
        this.app.ticker.stop();
        SoundManager.stopMusic();
        SoundManager.play('victory');

        if (!this._waveMode) {
            const tiempoSegundos = Math.floor(this._matchTimer / 60);
            const min    = Math.floor(tiempoSegundos / 60);
            const seg    = tiempoSegundos % 60;
            const tiempo = `${min}:${seg.toString().padStart(2, '0')}`;

            const tiempoEl = document.getElementById('victory-time');
            if (tiempoEl) tiempoEl.textContent = `TIME: ${tiempo}`;

            // Limpiamos el localStorage si tiene formato viejo (número suelto)
            let scores = [];
            try {
                const raw = localStorage.getItem(Config.scoreKey);
                const parsed = JSON.parse(raw);
                scores = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                scores = [];
                localStorage.removeItem(Config.scoreKey);
            }

            const esTop10 = scores.length < 10 || tiempoSegundos < scores[scores.length - 1]?.time;

            const recordEl = document.getElementById('victory-record');
            const formEl   = document.getElementById('victory-name-form');
            const inputEl  = document.getElementById('victory-name-input');

            if (esTop10) {
                if (recordEl) recordEl.textContent    = '★ TOP 10!';
                if (formEl)   formEl.style.display    = 'flex';
                if (formEl)   formEl.dataset.time     = tiempoSegundos;
                if (inputEl)  inputEl.value           = '';
                if (inputEl)  setTimeout(() => inputEl.focus(), 100);
            } else {
                if (recordEl) recordEl.textContent = '';
                if (formEl)   formEl.style.display = 'none';
            }
        }

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