const HABILIDADES = [
    {
        id:   'biomass',
        tipo: 'lmb',
        nombre: 'Biomass Collapse',
        desc: 'Hasta 15 zombies cercanos forman una bola. Clickea la bola para patearla. Aturde humanos, daña enemigos y deja un rastro de veneno.',
    },
    {
        id:   'combustion',
        tipo: 'lmb',
        nombre: 'Kick-Start Combustion',
        desc: 'Patea un zombie cercano hacia la dirección del cursor. Al impactar explota en un radio, infectando/dañando todo lo que toca.',
    },
    {
        id:   'dagger',
        tipo: 'rmb',
        nombre: 'Putrified Daggers',
        desc: 'Dispara un burst de 3 proyectiles. Requiere 3 impactos para infectar humanos. +50% de daño a enemigos.',
    },
    {
        id:   'pit',
        tipo: 'rmb',
        nombre: 'Poisonous Pit',
        desc: 'El proyectil deja un charco venenoso al impactar. Frena, bloquea ataques y aplica pulsos de daño/infección durante 4 segundos.',
    },
];

// Elige una habilidad LMB y una RMB al azar de las no elegidas todavía.
function elegirHabilidades(yaElegidas) {
    const lmbDisp = HABILIDADES.filter(h => h.tipo === 'lmb' && !yaElegidas.includes(h.id));
    const rmbDisp = HABILIDADES.filter(h => h.tipo === 'rmb' && !yaElegidas.includes(h.id));

    const lmb = lmbDisp[Math.floor(Math.random() * lmbDisp.length)] || null;
    const rmb = rmbDisp[Math.floor(Math.random() * rmbDisp.length)] || null;

    return { lmb, rmb };
}


const charcos = [];

class CharcoPit {
    constructor(x, y, worldContainer) {
        this.x    = x;
        this.y    = y;
        this._wc  = worldContainer;

        this._timer      = Config.pitDuration;
        this._pulseCada  = Config.pitDuration / Config.pitPulses; // frames entre pulsos
        this._pulseTimer = this._pulseCada;
        this._muerto     = false;

        // Visual: círculo verde oscuro semitransparente
        this.graphic = new PIXI.Graphics();
        this._dibujar(1);
        worldContainer.addChild(this.graphic);
    }

    _dibujar(alpha) {
        this.graphic.clear();
        this.graphic.beginFill(0x33691e, alpha * 0.45);
        this.graphic.lineStyle(2, 0x69f0ae, alpha * 0.6);
        this.graphic.drawCircle(this.x, this.y, Config.pitRadius);
        this.graphic.endFill();
    }

    update(deltaTime, allHumans, allPolicia, zombies) {
        if (this._muerto) return;

        this._timer      -= deltaTime;
        this._pulseTimer -= deltaTime;

        const alpha = Math.max(0, this._timer / Config.pitDuration);
        this._dibujar(alpha);

        // Aplicar lentitud y bloqueo de ataque a todo lo que esté adentro
        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(h.x, h.y, this.x, this.y) < Config.pitRadius) {
                h._pitSlowed  = true;
                h._pitNoAtack = true;
            }
        }
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            if (Utils.distance(cop.x, cop.y, this.x, this.y) < Config.pitRadius) {
                cop._pitSlowed  = true;
                cop._pitNoAtack = true;
            }
        }

        // Pulso de daño
        if (this._pulseTimer <= 0) {
            this._pulseTimer = this._pulseCada;
            this._aplicarPulso(allHumans, allPolicia, zombies);
        }

        if (this._timer <= 0) {
            this._muerto = true;
            this._wc.removeChild(this.graphic);
        }
    }

    _aplicarPulso(allHumans, allPolicia, zombies) {
        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(h.x, h.y, this.x, this.y) < Config.pitRadius) {
                h._infeccionAcum = (h._infeccionAcum || 0) + Config.pitHumanInfectRate;
                if (h._infeccionAcum >= Config.daggerHitsToInfect) {
                    h._infeccionAcum = 0;
                    h.startInfection(this._wc, zombies);
                }
            }
        }
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            if (Utils.distance(cop.x, cop.y, this.x, this.y) < Config.pitRadius) {
                cop._hits -= Config.pitEnemyDamage / Config.policiaBulletDamage;
                if (cop._hits <= 0) cop._dead = true;
            }
        }
    }

    destroy() {
        if (this.graphic.parent) this._wc.removeChild(this.graphic);
    }
}

class ZombieProyectil {
    constructor(zombie, dirX, dirY, worldContainer) {
        this._zombie = zombie;
        this._wc     = worldContainer;
        this.x       = zombie.x;
        this.y       = zombie.y;
        this._vx     = dirX * Config.combustionPushSpeed;
        this._vy     = dirY * Config.combustionPushSpeed;
        this._distRecorrida = 0;
        this._muerto = false;

        // Ocultamos el container original mientras vuela
        zombie.container.visible = false;

        // Usamos el sprite del zombie con tinte rojo
        this.container = new PIXI.Container();
        this.container.x = this.x;
        this.container.y = this.y;

        if (zombieAnimations.move) {
            this.sprite = new PIXI.AnimatedSprite(zombieAnimations.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.3; // más rápido para dar sensación de vuelo
            this.sprite.tint = 0xff2200;
            this.sprite.play();
            this.container.addChild(this.sprite);
        }

        worldContainer.addChild(this.container);
    }

    update(deltaTime, allHumans, allPolicia, zombies, worldContainer) {
        if (this._muerto) return;

        this.x += this._vx * deltaTime;
        this.y += this._vy * deltaTime;
        this._distRecorrida += Math.hypot(this._vx, this._vy) * deltaTime;
        this.container.x = this.x;
        this.container.y = this.y;
        if (this.sprite) this.sprite.scale.x = this._vx >= 0 ? 1 : -1;

        let explotar = false;

        // Explotamos si llegamos al límite de distancia
        if (this._distRecorrida >= Config.combustionPushDist) explotar = true;

        // O si tocamos un humano o enemigo
        if (!explotar) {
            for (const h of allHumans) {
                if (h._infected) continue;
                if (Utils.distance(this.x, this.y, h.x, h.y) < 20) { explotar = true; break; }
            }
        }
        if (!explotar) {
            for (const cop of allPolicia) {
                if (cop._dead) continue;
                if (Utils.distance(this.x, this.y, cop.x, cop.y) < 20) { explotar = true; break; }
            }
        }

        if (explotar) this._explotar(allHumans, allPolicia, zombies, worldContainer);
    }

    _explotar(allHumans, allPolicia, zombies, worldContainer) {
        this._muerto = true;
        this._zombie._dead = true;
        worldContainer.removeChild(this.container);

        // Infectar humanos en el radio
        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(this.x, this.y, h.x, h.y) < Config.combustionRadius) {
                h.startInfection(worldContainer, zombies);
            }
        }

        // Dañar enemigos en el radio (equivale a 2 balas básicas)
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            if (Utils.distance(this.x, this.y, cop.x, cop.y) < Config.combustionRadius) {
                cop._hits -= Config.combustionDamage / Config.policiaBulletDamage;
                if (cop._hits <= 0) cop._dead = true;
            }
        }

        // Animación de explosión (ring verde, igual que el brawler pero verde)
        const ring = new PIXI.Graphics();
        worldContainer.addChild(ring);
        let frame = 0;
        const frames = 20;
        const cx = this.x, cy = this.y;
        const animar = () => {
            frame++;
            const progress = frame / frames;
            const radius   = Config.combustionRadius * progress;
            const alpha    = 1 - progress;
            ring.clear();
            ring.lineStyle(2, 0x69f0ae, alpha);
            ring.beginFill(0x69f0ae, alpha * 0.15);
            ring.drawCircle(cx, cy, radius);
            ring.endFill();
            if (frame < frames) requestAnimationFrame(animar);
            else { ring.clear(); worldContainer.removeChild(ring); }
        };
        requestAnimationFrame(animar);
    }
}

class BiomassBall {
    constructor(x, y, zombies, worldContainer) {
        this.x       = x;
        this.y       = y;
        this._wc     = worldContainer;
        this._vx     = 0;
        this._vy     = 0;
        this._muerto = false;
        this._golpeados    = new Set();
        this._trailTimer   = 0;
        this._disbandTimer = -1;
        this._enMovimiento = false; // true después del primer kick

        // Visual del círculo de la bola
        this._gfx = new PIXI.Graphics();
        this._dibujarCirculo();
        worldContainer.addChild(this._gfx);

        // Agarramos los zombies más cercanos al punto clickeado
        this._zombies = zombies
            .filter(z => !z._dead)
            .sort((a, b) =>
                Utils.distance(a.x, a.y, x, y) -
                Utils.distance(b.x, b.y, x, y)
            )
            .slice(0, Config.bioZombieCount);

        for (const z of this._zombies) {
            z._bioBall = true;
        }
    }

    _dibujarCirculo() {
        this._gfx.clear();
        this._gfx.lineStyle(2, 0x69f0ae, 0.6);
        this._gfx.beginFill(0x1b5e20, 0.25);
        this._gfx.drawCircle(this.x, this.y, Config.bioBallRadius);
        this._gfx.endFill();
    }

    kick(cursorX, cursorY) {
        const dir    = Utils.normalize(cursorX - this.x, cursorY - this.y);
        this._vx     = dir.x * Config.bioBallForce;
        this._vy     = dir.y * Config.bioBallForce;
        this._enMovimiento  = true;
        this._disbandTimer  = -1;
        this._golpeados.clear();
    }

    update(delta, allHumans, allPolicia, allZombies, worldContainer) {
        if (this._muerto) return;

        // ── Física de la bola ──────────────────────────────────────────
        if (this._enMovimiento) {
            this._vx *= Config.bioBallFriction;
            this._vy *= Config.bioBallFriction;
            this.x   += this._vx * delta;
            this.y   += this._vy * delta;

            this.x = Utils.clamp(this.x, 16, Config.worldWidth  - 16);
            this.y = Utils.clamp(this.y, 16, Config.worldHeight - 16);

            // Trail de charcos mientras se mueve
            this._trailTimer -= delta;
            if (this._trailTimer <= 0) {
                this._trailTimer = Config.bioTrailInterval;
                charcos.push(new CharcoPit(this.x, this.y, worldContainer));
            }

            // Contacto con humanos
            for (const h of allHumans) {
                if (h._infected || h._biogolpeado) continue;
                if (Utils.distance(h.x, h.y, this.x, this.y) < Config.bioContactRadius) {
                    h._biogolpeado = true;
                    h._stunTimer   = Config.bioHumanStunDuration;
                    const dir = Utils.normalize(h.x - this.x, h.y - this.y);
                    h.x += dir.x * Config.bioPushForce;
                    h.y += dir.y * Config.bioPushForce;
                }
            }

            // Contacto con enemigos — hit único
            for (const cop of allPolicia) {
                if (cop._dead || this._golpeados.has(cop)) continue;
                if (Utils.distance(cop.x, cop.y, this.x, this.y) < Config.bioContactRadius) {
                    this._golpeados.add(cop);
                    cop._hits -= Config.bioEnemyDamage / Config.policiaBulletDamage;
                    if (cop._actualizarBarraVida) cop._actualizarBarraVida();
                    if (cop._hits <= 0) cop._dead = true;
                    const dir = Utils.normalize(cop.x - this.x, cop.y - this.y);
                    cop.x += dir.x * Config.bioPushForce;
                    cop.y += dir.y * Config.bioPushForce;
                }
            }

            // Cuando frena, iniciamos el timer de disolución
            const speed = Math.hypot(this._vx, this._vy);
            if (speed < Config.bioBallStopSpeed) {
                this._enMovimiento = false;
                this._disbandTimer = Config.bioDisbandDelay;
            }
        }

        // ── Timer de disolución ────────────────────────────────────────
        if (!this._enMovimiento && this._disbandTimer >= 0) {
            this._disbandTimer -= delta;
            if (this._disbandTimer <= 0) {
                this._disolver();
                return;
            }
        }

        // ── Zombies se mueven dentro de la bola con separación entre ellos ──
        for (const z of this._zombies) {
            if (z._dead) continue;

            // Asignamos un offset fijo aleatorio la primera vez
            if (z._bioOffsetX === undefined) {
                const angle    = Utils.randomAngle();
                const r        = Math.random() * Config.bioBallRadius * 0.6;
                z._bioOffsetX  = Math.cos(angle) * r;
                z._bioOffsetY  = Math.sin(angle) * r;
            }

            // Target: centro de la bola + offset personal
            const targetX = this.x + z._bioOffsetX;
            const targetY = this.y + z._bioOffsetY;

            const dx   = targetX - z.x;
            const dy   = targetY - z.y;
            const dist = Math.hypot(dx, dy);

            // Corre hacia su target
            if (dist > 2) {
                const spd = Config.bioZombieChaseSpeed * delta;
                z.x += (dx / dist) * Math.min(spd, dist);
                z.y += (dy / dist) * Math.min(spd, dist);
            }

            // Separación entre zombies de la bola
            for (const other of this._zombies) {
                if (other === z || other._dead) continue;
                const ox   = z.x - other.x;
                const oy   = z.y - other.y;
                const od   = Math.hypot(ox, oy);
                if (od > 0 && od < Config.boidsSepRadius * 0.8) {
                    const push = (Config.boidsSepRadius * 0.8 - od) / (Config.boidsSepRadius * 0.8) * 1.5;
                    z.x += (ox / od) * push;
                    z.y += (oy / od) * push;
                }
            }

            // Clamp: no salirse del radio de la bola
            const fromCenter = Math.hypot(z.x - this.x, z.y - this.y);
            if (fromCenter > Config.bioBallRadius) {
                const angle = Utils.angleTo(this.x, this.y, z.x, z.y);
                z.x = this.x + Math.cos(angle) * Config.bioBallRadius;
                z.y = this.y + Math.sin(angle) * Config.bioBallRadius;
            }

            z.headingX = dx;
            z.headingY = dy;
            z.flipSprite   && z.flipSprite();
            z._actualizarContorno && z._actualizarContorno(true);
            z.container.x = z.x;
            z.container.y = z.y;
        }

        // Actualizamos el visual del círculo
        this._dibujarCirculo();
    }

    _disolver() {
        this._muerto = true;
        this._wc.removeChild(this._gfx);
        for (const z of this._zombies) {
            z._bioBall    = false;
            z._bioOffsetX = undefined;
            z._bioOffsetY = undefined;
            z._actualizarContorno && z._actualizarContorno(false);
        }
    }
}