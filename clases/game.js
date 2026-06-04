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

        this._upgradeCount      = 0;    // cuántas veces apareció la pantalla
        this._paused            = false;
        this._lmbUpgrade        = null; // id de la habilidad LMB elegida
        this._rmbUpgrade        = null; // id de la habilidad RMB elegida
        this._daggerHits        = {};   // hits acumulados por humano para la daga
        this._habilidadesUsadas = [];   // ids ya ofrecidos
        this._zombieProyectil   = null; // zombie volando (combustion)
        this._combustionCD      = 0;    // cooldown de combustion 

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
            if (e.button !== 2) {
                // El LMB default ya no hace nada especial acá, se maneja en _tick
                return;
            }
            if (!this.player.isZombie) {
                this.player.becomeZombie(this.worldContainer, this.humans, this.zombies);
            } else {
                const cooldown = this._rmbUpgrade === 'dagger'
                    ? Config.daggerCooldown
                    : Config.playerBulletCooldown;
                if (this.player._bulletCooldown <= 0) {
                    this.player.attack();
                    this.player._bulletCooldown = cooldown;
                    const angle = Utils.angleTo(
                        this.player.x, this.player.y,
                        Mouse.worldX(this.camera.offsetX),
                        Mouse.worldY(this.camera.offsetY)
                    );
                    if (this._rmbUpgrade === 'dagger') {
                        // Burst de 3 proyectiles con spread
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
                        this.bullets.push(
                            new BalaPit(this.player.x, this.player.y, angle, this.worldContainer)
                        );
                    } else {
                        this.bullets.push(
                            new Bala(this.player.x, this.player.y, angle, this.worldContainer)
                        );
                    }
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

        if (this._paused) return;

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

        // Mostramos upgrade cada 25% de infectados
        if (this.player.isZombie) {
            const infectedCount = this.humans.filter(h => h._infected).length;
            const threshold = Math.floor(Config.humanCount * 0.25) * (this._upgradeCount + 1);
            if (infectedCount >= threshold && !this._paused && this._upgradeCount < 4) {
                this._upgradeCount++;
                this._mostrarUpgrade();
            }
        }

        // LMB: zaturn (rota los targets solo mientras se mantiene apretado)
        if (this._lmbUpgrade === 'zaturn' && Mouse.leftHeld && this.player.isZombie) {
            this._updateOrbit(delta);
        } else if (this._lmbUpgrade === 'zaturn') {
            // Sin LMB apretado, los zombies vuelven a su AI normal
            for (const z of this.zombies) {
                z._orbitTargetX = undefined;
                z._orbitTargetY = undefined;
            }
        }

        // LMB: combustion (solo al hacer click, manejado en _tickCombustion)
        if (this._lmbUpgrade === 'combustion') {
            this._tickCombustion(delta);
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
            this._lmbUpgrade = id;
            if (id === 'zaturn') {
                for (const z of this.zombies) {
                    z._orbitAngle = Utils.angleTo(this.player.x, this.player.y, z.x, z.y);
                }
            }
        } else {
            this._rmbUpgrade = id;
            const cdShot = document.getElementById('cd-shot');
            if (cdShot) cdShot.style.background = id === 'dagger' ? '#ffb74d' : '#33691e';
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

        // Solo dispara al hacer click (mousedown detectado via Mouse.leftHeld como flanco)
        if (!Mouse.leftHeld || !this.player.isZombie) return;
        if (this._combustionCD > 0) return;
        if (this._zombieProyectil && !this._zombieProyectil._muerto) return;

        // Buscamos el zombie más cercano al jugador dentro del radio
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
};
