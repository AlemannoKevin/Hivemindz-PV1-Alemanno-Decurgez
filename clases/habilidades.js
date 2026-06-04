const HABILIDADES = [
    {
        id:   'zaturn',
        tipo: 'lmb',
        nombre: 'Zaturnian Presence',
        desc: 'Los zombies en pantalla ganan +50% velocidad y orbitan al jugador en sentido horario mientras se mantiene LMB.',
    },
    {
        id:   'combustion',
        tipo: 'lmb',
        nombre: 'Spontaneous Combustion',
        desc: 'Mantené LMB cerca de un zombie para lanzarlo hacia el cursor. Al impactar explota en un radio, infectando/dañando todo lo que toca.',
    },
    {
        id:   'dagger',
        tipo: 'rmb',
        nombre: 'Putrified Daggers',
        desc: 'Dispara un burst de 3 proyectiles. Mitad de cooldown. Requiere 2 impactos para infectar humanos. Hace +50% de daño a enemigos.',
    },
    {
        id:   'pit',
        tipo: 'rmb',
        nombre: 'Poisonous Pit',
        desc: 'El proyectil deja un charco al impactar. Frena, bloquea ataques y aplica pulsos de daño/infección durante 4 segundos.',
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