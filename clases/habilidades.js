const HABILIDADES = [

    {
        id:   'cometogether',
        tipo: 'lmb',
        nombre: 'Come Together',
        desc: 'Zombies te rodean por unos segundos, antes de explotar y desparramarlos por la zona con buffs. Eres invulnerable durante la habilidad.',
    },
    {
        id:   'necrotic',
        tipo: 'rmb',
        nombre: 'Necrotic Pulses',
        desc: 'Pulsos automáticos alrededor del jugador cada segundo. Infecta, ralentiza. El jugador se ralentiza pero el cooldown del dash baja al 25%.',
    },
    {
        id:   'biomass',
        tipo: 'lmb',
        nombre: 'Biomass Collapse',
        desc: 'Hasta 15 zombies cercanos colapsan en una bola. La masa de zombies persigue enemigos con mayor velocidad y resistencia al empuje.',
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
        desc: 'Lanza un proyectil que deja un charco venenoso al impactar. Frena, bloquea ataques y aplica pulsos de daño/infección durante 4 segundos.',
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
                // Umbral unificado: brawlers necesitan brawlerInfectHits, humanos daggerHitsToInfect
                const umbral = (h instanceof Peleador)
                    ? Config.brawlerInfectHits
                    : Config.daggerHitsToInfect;
                h._infeccionAcum = (h._infeccionAcum || 0) + Config.pitHumanInfectRate;
                if (h._actualizarBarraInfeccion) h._actualizarBarraInfeccion();
                if (h._infeccionAcum >= umbral) {
                    h._infeccionAcum = 0;
                    h.startInfection(this._wc, zombies);
                }
            }
        }
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            if (Utils.distance(cop.x, cop.y, this.x, this.y) < Config.pitRadius) {
                cop._hits -= Config.pitEnemyDamage / Config.policiaBulletDamage;
                if (cop._actualizarBarraVida) cop._actualizarBarraVida();
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
                if (cop._actualizarBarraVida) cop._actualizarBarraVida();
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
    constructor(cursorX, cursorY, zombies, worldContainer) {
        this._wc    = worldContainer;
        this._muerto = false;
        this._timer  = Config.bioDuration;

        // El zombie central es el más cercano al cursor
        const candidatos = zombies
            .filter(z => !z._dead)
            .sort((a, b) =>
                Utils.distance(a.x, a.y, cursorX, cursorY) -
                Utils.distance(b.x, b.y, cursorX, cursorY)
            );

        this._central = candidatos[0] || null;
        if (!this._central) { this._muerto = true; return; }

        // Hasta 24 zombies más cercanos al central (excluyendo el central)
        this._zombies = candidatos
            .slice(1)
            .slice(0, Config.bioZombieCount);

        // Marcamos todos
        this._central._bioCentral = true;
        this._central._bioDetectBoost = Config.bioDetectBoost;
        for (const z of this._zombies) {
            z._bioBall = true;
        }
    }

    update(delta, allHumans, allPolicia, allZombies, worldContainer) {
        if (this._muerto) return;

        this._timer -= delta;
        if (this._timer <= 0) {
            this._disolver();
            return;
        }

        if (!this._central || this._central._dead) {
            this._disolver();
            return;
        }

        // Zombies del grupo se mueven hacia el central a velocidad constante
        for (const z of this._zombies) {
            if (z._dead) continue;

            const dx   = this._central.x - z.x;
            const dy   = this._central.y - z.y;
            const dist = Math.hypot(dx, dy);

            if (dist > Config.bioBallRadius) {
                // Se acerca al central a mayor velocidad cuanto más lejos está
                const spd = Config.bioZombieChaseSpeed * delta * Math.min(3, dist / Config.bioBallRadius);
                z.x += (dx / dist) * spd;
                z.y += (dy / dist) * spd;
            } else {
                // Dentro del radio — separación suave entre ellos
                for (const other of this._zombies) {
                    if (other === z || other._dead) continue;
                    const ox = z.x - other.x;
                    const oy = z.y - other.y;
                    const od = Math.hypot(ox, oy);
                    if (od > 0 && od < Config.boidsSepRadius * 0.5) {
                        const push = (Config.boidsSepRadius * 0.5 - od) / (Config.boidsSepRadius * 0.5) * 0.8;
                        z.x += (ox / od) * push;
                        z.y += (oy / od) * push;
                    }
                }

                // Clamp al radio del central
                const fromCenter = Math.hypot(z.x - this._central.x, z.y - this._central.y);
                if (fromCenter > Config.bioBallRadius) {
                    const angle = Utils.angleTo(this._central.x, this._central.y, z.x, z.y);
                    z.x = this._central.x + Math.cos(angle) * Config.bioBallRadius;
                    z.y = this._central.y + Math.sin(angle) * Config.bioBallRadius;
                }
            }

            z.headingX = dx;
            z.headingY = dy;
            z.flipSprite && z.flipSprite();
            z._actualizarContorno && z._actualizarContorno(true);
            z.container.x = z.x;
            z.container.y = z.y;
        }

        // El central también tiene contorno
        this._central._actualizarContorno && this._central._actualizarContorno(true);
    }

    _disolver() {
        this._muerto = true;
        if (this._central) {
            this._central._bioCentral    = false;
            this._central._bioDetectBoost = 1;
            this._central._actualizarContorno && this._central._actualizarContorno(false);
        }
        for (const z of this._zombies) {
            z._bioBall = false;
            z._actualizarContorno && z._actualizarContorno(false);
        }
    }
}

class ComeTogether {
    constructor(player, zombies, worldContainer) {
        this._player = player;
        this._wc     = worldContainer;
        this._timer  = Config.comeTogetherDuration;
        this._muerto = false;

        // Marcamos hasta 25 zombies en pantalla más cercanos
        this._zombies = zombies
            .filter(z => !z._dead && Game.instance._isOnScreen(z))
            .sort((a, b) =>
                Utils.distance(a.x, a.y, player.x, player.y) -
                Utils.distance(b.x, b.y, player.x, player.y)
            )
            .slice(0, Config.comeTogetherZombies);

        for (const z of this._zombies) {
            z._comeTogether = true;
        }

        // Jugador invulnerable y verde
        player._comeTogether    = true;
        player._comeTogetherGfx = true;
        if (player.sprite) player.sprite.tint = 0x69f0ae;
    }

    update(delta, allHumans, allPolicia) {
        if (this._muerto) return;

        this._timer -= delta;

        // Mover zombies hacia el jugador
        for (const z of this._zombies) {
            if (z._dead || !z._comeTogether) continue;

            const dx   = this._player.x - z.x;
            const dy   = this._player.y - z.y;
            const dist = Math.hypot(dx, dy);

            if (dist > Config.comeTogetherRadius) {
                // Todavía en camino
                const spd = Config.zombieSpeed * Config.comeTogetherSpeed * delta;
                z.x += (dx / dist) * spd;
                z.y += (dy / dist) * spd;
                z.headingX = dx;
                z.headingY = dy;
                z.flipSprite   && z.flipSprite();
                z._actualizarContorno && z._actualizarContorno(true);
                z.container.x = z.x;
                z.container.y = z.y;
            } else {
                // Ya llegó — separación dentro del radio
                for (const other of this._zombies) {
                    if (other === z || other._dead) continue;
                    const ox = z.x - other.x;
                    const oy = z.y - other.y;
                    const od = Math.hypot(ox, oy);
                    if (od > 0 && od < Config.boidsSepRadius * 0.8) {
                        const push = (Config.boidsSepRadius * 0.8 - od) / (Config.boidsSepRadius * 0.8) * 1.5;
                        z.x += (ox / od) * push;
                        z.y += (oy / od) * push;
                    }
                }
                // Clamp al radio
                const fromPlayer = Math.hypot(z.x - this._player.x, z.y - this._player.y);
                if (fromPlayer > Config.comeTogetherRadius) {
                    const angle = Utils.angleTo(this._player.x, this._player.y, z.x, z.y);
                    z.x = this._player.x + Math.cos(angle) * Config.comeTogetherRadius;
                    z.y = this._player.y + Math.sin(angle) * Config.comeTogetherRadius;
                }
                z._actualizarContorno && z._actualizarContorno(true);
                z.container.x = z.x;
                z.container.y = z.y;
            }
        }

        if (this._timer <= 0) this._explotar();
    }

    _explotar() {
        this._muerto = true;

        // Restauramos al jugador
        this._player._comeTogether = false;
        if (this._player.sprite) this._player.sprite.tint = 0xffffff;

        for (const z of this._zombies) {
            z._comeTogether = false;
            z._actualizarContorno && z._actualizarContorno(false);
            const dist = Math.hypot(z.x - this._player.x, z.y - this._player.y);
            if (dist <= Config.comeTogetherRadius) {
                const angle = Utils.angleTo(this._player.x, this._player.y, z.x, z.y);
                const force = Config.comeTogetherForce;
                z._pushVx = Math.cos(angle) * force;
                z._pushVy = Math.sin(angle) * force;
                // Boost temporal post-explosión
                z._ctBoostTimer        = Config.comeTogetherBoostDuration;
                z._ctReducedAttackCD   = true;
                if (z.sprite) z.sprite.tint = 0xff4444;
            }
        }

        // 3 rings azules escalonados, tamaño triple del brawler
        const cx = this._player.x;
        const cy = this._player.y;
        const maxRadius = Config.comeTogetherRadius * 3.9; // ~3x el radio original * 1.3

        [0, 6, 12].forEach(frameOffset => {
            const ring = new PIXI.Graphics();
            this._wc.addChild(ring);
            let frame = -frameOffset;
            const frames = 30;
            const animar = () => {
                frame++;
                if (frame <= 0) { requestAnimationFrame(animar); return; }
                const progress = frame / frames;
                const radius   = maxRadius * progress;
                const alpha    = 1 - progress;
                ring.clear();
                ring.lineStyle(3, 0x4488ff, alpha);
                ring.beginFill(0x4488ff, alpha * 0.12);
                ring.drawCircle(cx, cy, radius);
                ring.endFill();
                if (frame < frames) requestAnimationFrame(animar);
                else { ring.clear(); this._wc.removeChild(ring); }
            };
            requestAnimationFrame(animar);
        });
    }
}

class NecroticPulses {
    constructor(player, worldContainer) {
        this._player = player;
        this._wc     = worldContainer;
        this._timer  = Config.necroticPulseInterval;
    }

    update(delta, allHumans, allPolicia, zombies) {
        this._timer -= delta;
        if (this._timer <= 0) {
            this._timer = Config.necroticPulseInterval;
            this._pulsar(allHumans, allPolicia, zombies);
        }
    }

    _pulsar(allHumans, allPolicia, zombies) {
        const px = this._player.x;
        const py = this._player.y;

        // Visual: anillo verde que aparece y desaparece rápido
        const ring = new PIXI.Graphics();
        this._wc.addChild(ring);
        let frame = 0;
        const frames = 18;
        const animar = () => {
            frame++;
            const progress = frame / frames;
            // Fade in rápido, fade out rápido
            const alpha = progress < 0.3
                ? progress / 0.3
                : 1 - ((progress - 0.3) / 0.7);
            const radius = Config.necroticPulseRadius * (0.6 + progress * 0.4);
            ring.clear();
            ring.lineStyle(3, 0x69f0ae, alpha * 0.9);
            ring.beginFill(0x69f0ae, alpha * 0.12);
            ring.drawCircle(px, py, radius);
            ring.endFill();
            if (frame < frames) requestAnimationFrame(animar);
            else { ring.clear(); this._wc.removeChild(ring); }
        };
        requestAnimationFrame(animar);

        // Aplicar a humanos
        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(h.x, h.y, px, py) > Config.necroticPulseRadius) continue;
            const umbral = (h instanceof Peleador)
                ? Config.brawlerInfectHits
                : Config.daggerHitsToInfect;
            h._infeccionAcum   = (h._infeccionAcum || 0) + Config.necroticPulseInfectRate;
            h._necroticSlowed  = true;
            if (h._actualizarBarraInfeccion) h._actualizarBarraInfeccion();
            if (h._infeccionAcum >= umbral) {
                h._infeccionAcum = 0;
                h.startInfection(this._wc, zombies);
            }
        }

        // Aplicar a enemigos
        for (const cop of allPolicia) {
            if (cop._dead) continue;
            if (Utils.distance(cop.x, cop.y, px, py) > Config.necroticPulseRadius) continue;
            cop._necroticSlowed = true;
            cop._hits -= Config.necroticPulseEnemyDamage / Config.policiaBulletDamage;
            if (cop._actualizarBarraVida) cop._actualizarBarraVida();
            if (cop._hits <= 0) cop._dead = true;
        }
    }
}

/*function aplicarPunch(player, humans, policia, zombies, worldContainer, cursorX, cursorY) {
    const px        = player.x;
    const py        = player.y;
    const angleBase = Utils.angleTo(px, py, cursorX, cursorY);
    const mitad     = Config.punchAngle / 2;

    // Animación del abanico
    const gfx = new PIXI.Graphics();
    worldContainer.addChild(gfx);
    let frame = 0;
    const frames = 10;
    const animar = () => {
        frame++;
        const alpha = 1 - (frame / frames);
        gfx.clear();
        gfx.lineStyle(2, 0x69f0ae, alpha);
        gfx.beginFill(0x69f0ae, alpha * 0.25);
        gfx.moveTo(px, py);
        gfx.arc(px, py, Config.punchRange, angleBase - mitad, angleBase + mitad);
        gfx.lineTo(px, py);
        gfx.endFill();
        if (frame < frames) requestAnimationFrame(animar);
        else { gfx.clear(); worldContainer.removeChild(gfx); }
    };
    requestAnimationFrame(animar);

    // Función de chequeo dentro del abanico
    const enAbanico = (tx, ty) => {
        const dist = Utils.distance(tx, ty, px, py);
        if (dist > Config.punchRange) return false;
        const angle = Utils.angleTo(px, py, tx, ty);
        let diff = angle - angleBase;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return Math.abs(diff) <= mitad;
    };

    // Knockback radial desde el jugador
    for (const h of humans) {
        if (h._infected) continue;
        if (!enAbanico(h.x, h.y)) continue;
        const dir = Utils.normalize(h.x - px, h.y - py);
        h._pushVx = dir.x * Config.punchKnockback;
        h._pushVy = dir.y * Config.punchKnockback;
        if (h instanceof Peleador) {
            h._infeccionAcum = (h._infeccionAcum || 0) + 1;
            if (h._actualizarBarraInfeccion) h._actualizarBarraInfeccion();
            if (h._infeccionAcum >= Config.brawlerInfectHits) {
                h._infeccionAcum = 0;
                h.startInfection(worldContainer, zombies);
            }
        } else {
            h.startInfection(worldContainer, zombies);
        }
    }

    for (const cop of policia) {
        if (cop._dead) continue;
        if (!enAbanico(cop.x, cop.y)) continue;
        const dir = Utils.normalize(cop.x - px, cop.y - py);
        cop._pushVx = dir.x * Config.punchKnockback;
        cop._pushVy = dir.y * Config.punchKnockback;
        cop._hits -= Config.punchDamage / Config.policiaBulletDamage;
        if (cop._actualizarBarraVida) cop._actualizarBarraVida();
        if (cop._hits <= 0) cop._dead = true;
    }
}*/