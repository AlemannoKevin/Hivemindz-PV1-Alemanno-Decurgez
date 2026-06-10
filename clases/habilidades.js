// ── Registro de habilidades ───────────────────────────────────────────────────
const HABILIDADES = [
    { id: 'cometogether', tipo: 'lmb', nombre: 'Come Together',
      desc: 'Zombies te rodean por unos segundos, antes de explotar y desparramarlos por la zona con buffs. Eres invulnerable durante la habilidad.' },
    { id: 'biomass',      tipo: 'lmb', nombre: 'Biomass Collapse',
      desc: 'Hasta 15 zombies cercanos colapsan en una bola. La masa persigue enemigos con mayor velocidad y resistencia al empuje.' },
    { id: 'combustion',   tipo: 'lmb', nombre: 'Kick-Start Combustion',
      desc: 'Patea un zombie cercano hacia el cursor. Al impactar explota infectando/dañando todo lo que toca.' },
    { id: 'necrotic',     tipo: 'rmb', nombre: 'Necrotic Pulses',
      desc: 'Pulsos automáticos alrededor del jugador. Infecta y ralentiza. El jugador se ralentiza pero el cooldown del dash baja al 50%.' },
    { id: 'dagger',       tipo: 'rmb', nombre: 'Putrified Daggers',
      desc: 'Burst de 3 proyectiles. Requiere 3 impactos para infectar. +50% daño a enemigos.' },
    { id: 'pit',          tipo: 'rmb', nombre: 'Poisonous Pit',
      desc: 'Proyectil que deja un charco venenoso. Frena, bloquea ataques y aplica pulsos de daño/infección durante 4 segundos.' },
];

function elegirHabilidades(yaElegidas) {
    const disp = tipo => HABILIDADES.filter(h => h.tipo === tipo && !yaElegidas.includes(h.id));
    const pick  = arr  => arr[Math.floor(Math.random() * arr.length)] || null;
    return { lmb: pick(disp('lmb')), rmb: pick(disp('rmb')) };
}

// ── Helpers visuales compartidos ──────────────────────────────────────────────
function _animarRingColor(wc, cx, cy, maxRadius, color, frames = 25, offset = 0) {
    const ring = new PIXI.Graphics();
    wc.addChild(ring);
    let frame = -offset;
    const animar = () => {
        frame++;
        if (frame <= 0) { requestAnimationFrame(animar); return; }
        const progress = frame / frames;
        const alpha    = 1 - progress;
        ring.clear();
        ring.lineStyle(3, color, alpha);
        ring.beginFill(color, alpha * 0.12);
        ring.drawCircle(cx, cy, maxRadius * progress);
        ring.endFill();
        if (frame < frames) requestAnimationFrame(animar);
        else { ring.clear(); wc.removeChild(ring); }
    };
    requestAnimationFrame(animar);
}

function _aplicarAUnidades(allHumans, allPolicia, cx, cy, radius, fnHumano, fnCop) {
    for (const h of allHumans) {
        if (h._infected) continue;
        if (Utils.distance(h.x, h.y, cx, cy) < radius) fnHumano(h);
    }
    for (const cop of allPolicia) {
        if (cop._dead) continue;
        if (Utils.distance(cop.x, cop.y, cx, cy) < radius) fnCop(cop);
    }
}

// ── Charcos ───────────────────────────────────────────────────────────────────
const charcos = [];

class CharcoPit {
    constructor(x, y, worldContainer) {
        this.x   = x;
        this.y   = y;
        this._wc = worldContainer;

        this._timer      = Config.pitDuration;
        this._pulseCada  = Config.pitDuration / Config.pitPulses;
        this._pulseTimer = this._pulseCada;
        this._muerto     = false;

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
        this._dibujar(Math.max(0, this._timer / Config.pitDuration));

        // Slow y bloqueo
        _aplicarAUnidades(allHumans, allPolicia, this.x, this.y, Config.pitRadius,
            h   => { h._pitSlowed = true; h._pitNoAtack = true; },
            cop => { cop._pitSlowed = true; cop._pitNoAtack = true; }
        );

        if (this._pulseTimer <= 0) {
            this._pulseTimer = this._pulseCada;
            this._aplicarPulso(allHumans, allPolicia, zombies);
        }
        if (this._timer <= 0) { this._muerto = true; this._wc.removeChild(this.graphic); }
    }

    _aplicarPulso(allHumans, allPolicia, zombies) {
        _aplicarAUnidades(allHumans, allPolicia, this.x, this.y, Config.pitRadius,
            h => {
                const umbral = (h instanceof Peleador) ? Config.brawlerInfectHits : Config.daggerHitsToInfect;
                h._infeccionAcum = (h._infeccionAcum || 0) + Config.pitHumanInfectRate;
                h._actualizarBarraInfeccion?.();
                if (h._infeccionAcum >= umbral) { h._infeccionAcum = 0; h.startInfection(this._wc, zombies); }
            },
            cop => {
                cop._hits -= Config.pitEnemyDamage / Config.policiaBulletDamage;
                cop._actualizarBarraVida?.();
                if (cop._hits <= 0) cop._dead = true;
            }
        );
    }

    destroy() { if (this.graphic.parent) this._wc.removeChild(this.graphic); }
}

// ── Zombie proyectil (Combustion) ─────────────────────────────────────────────
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

        zombie.container.visible = false;

        this.container = new PIXI.Container();
        this.container.x = this.x;
        this.container.y = this.y;

        if (zombieAnimations.move) {
            this.sprite = new PIXI.AnimatedSprite(zombieAnimations.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.3;
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

        const explotar =
            this._distRecorrida >= Config.combustionPushDist ||
            allHumans.some(h  => !h._infected  && Utils.distance(this.x, this.y, h.x,   h.y)   < 20) ||
            allPolicia.some(c => !c._dead       && Utils.distance(this.x, this.y, c.x,   c.y)   < 20);

        if (explotar) this._explotar(allHumans, allPolicia, zombies, worldContainer);
    }

    _explotar(allHumans, allPolicia, zombies, worldContainer) {
        this._muerto       = true;
        this._zombie._dead = true;
        worldContainer.removeChild(this.container);

        _aplicarAUnidades(allHumans, allPolicia, this.x, this.y, Config.combustionRadius,
            h   => h.startInfection(worldContainer, zombies),
            cop => {
                cop._hits -= Config.combustionDamage / Config.policiaBulletDamage;
                cop._actualizarBarraVida?.();
                if (cop._hits <= 0) cop._dead = true;
            }
        );

        _animarRingColor(worldContainer, this.x, this.y, Config.combustionRadius, 0x69f0ae, 20);
    }
}

// ── Biomass Collapse ──────────────────────────────────────────────────────────
class BiomassBall {
    constructor(cursorX, cursorY, zombies, worldContainer) {
        this._wc     = worldContainer;
        this._muerto = false;
        this._timer  = Config.bioDuration;

        const candidatos = zombies
            .filter(z => !z._dead)
            .sort((a, b) => Utils.distance(a.x, a.y, cursorX, cursorY) - Utils.distance(b.x, b.y, cursorX, cursorY));

        this._central = candidatos[0] || null;
        if (!this._central) { this._muerto = true; return; }

        this._zombies = candidatos.slice(1, Config.bioZombieCount + 1);

        this._central._bioCentral    = true;
        this._central._bioDetectBoost = Config.bioDetectBoost;
        for (const z of this._zombies) z._bioBall = true;
    }

    update(delta, allHumans, allPolicia, allZombies, worldContainer) {
        if (this._muerto) return;
        this._timer -= delta;
        if (this._timer <= 0 || !this._central || this._central._dead) { this._disolver(); return; }

        for (const z of this._zombies) {
            if (z._dead) continue;
            const dx   = this._central.x - z.x;
            const dy   = this._central.y - z.y;
            const dist = Math.hypot(dx, dy);

            if (dist > Config.bioBallRadius) {
                const spd = Config.bioZombieChaseSpeed * delta * Math.min(3, dist / Config.bioBallRadius);
                z.x += (dx / dist) * spd;
                z.y += (dy / dist) * spd;
            } else {
                // Separación suave dentro del radio
                for (const other of this._zombies) {
                    if (other === z || other._dead) continue;
                    const ox = z.x - other.x, oy = z.y - other.y;
                    const od = Math.hypot(ox, oy);
                    if (od > 0 && od < Config.boidsSepRadius * 0.5) {
                        const push = (Config.boidsSepRadius * 0.5 - od) / (Config.boidsSepRadius * 0.5) * 0.8;
                        z.x += (ox / od) * push;
                        z.y += (oy / od) * push;
                    }
                }
                const fromCenter = Math.hypot(z.x - this._central.x, z.y - this._central.y);
                if (fromCenter > Config.bioBallRadius) {
                    const angle = Utils.angleTo(this._central.x, this._central.y, z.x, z.y);
                    z.x = this._central.x + Math.cos(angle) * Config.bioBallRadius;
                    z.y = this._central.y + Math.sin(angle) * Config.bioBallRadius;
                }
            }

            z.headingX = dx; z.headingY = dy;
            z.flipSprite?.();
            z._actualizarContorno?.(true);
            z.container.x = z.x;
            z.container.y = z.y;
        }
        this._central._actualizarContorno?.(true);
    }

    _disolver() {
        this._muerto = true;
        if (this._central) {
            this._central._bioCentral     = false;
            this._central._bioDetectBoost = 1;
            this._central._actualizarContorno?.(false);
        }
        for (const z of this._zombies) { z._bioBall = false; z._actualizarContorno?.(false); }
    }
}

// ── Come Together ─────────────────────────────────────────────────────────────
class ComeTogether {
    constructor(player, zombies, worldContainer) {
        this._player = player;
        this._wc     = worldContainer;
        this._timer  = Config.comeTogetherDuration;
        this._muerto = false;

        this._zombies = zombies
            .filter(z => !z._dead && Game.instance._isOnScreen(z))
            .sort((a, b) => Utils.distance(a.x, a.y, player.x, player.y) - Utils.distance(b.x, b.y, player.x, player.y))
            .slice(0, Config.comeTogetherZombies);

        for (const z of this._zombies) z._comeTogether = true;
        player._comeTogether = true;
        if (player.sprite) player.sprite.tint = 0x69f0ae;
    }

    update(delta) {
        if (this._muerto) return;
        this._timer -= delta;

        for (const z of this._zombies) {
            if (z._dead || !z._comeTogether) continue;
            const dx   = this._player.x - z.x;
            const dy   = this._player.y - z.y;
            const dist = Math.hypot(dx, dy);

            if (dist > Config.comeTogetherRadius) {
                const spd = Config.zombieSpeed * Config.comeTogetherSpeed * delta;
                z.x += (dx / dist) * spd;
                z.y += (dy / dist) * spd;
                z.headingX = dx; z.headingY = dy;
            } else {
                // Separación dentro del radio
                for (const other of this._zombies) {
                    if (other === z || other._dead) continue;
                    const ox = z.x - other.x, oy = z.y - other.y;
                    const od = Math.hypot(ox, oy);
                    if (od > 0 && od < Config.boidsSepRadius * 0.8) {
                        const push = (Config.boidsSepRadius * 0.8 - od) / (Config.boidsSepRadius * 0.8) * 1.5;
                        z.x += (ox / od) * push;
                        z.y += (oy / od) * push;
                    }
                }
                const fromPlayer = Math.hypot(z.x - this._player.x, z.y - this._player.y);
                if (fromPlayer > Config.comeTogetherRadius) {
                    const angle = Utils.angleTo(this._player.x, this._player.y, z.x, z.y);
                    z.x = this._player.x + Math.cos(angle) * Config.comeTogetherRadius;
                    z.y = this._player.y + Math.sin(angle) * Config.comeTogetherRadius;
                }
            }
            z.flipSprite?.();
            z._actualizarContorno?.(true);
            z.container.x = z.x;
            z.container.y = z.y;
        }

        if (this._timer <= 0) this._explotar();
    }

    _explotar() {
        this._muerto = true;
        this._player._comeTogether = false;
        if (this._player.sprite) this._player.sprite.tint = 0xffffff;

        for (const z of this._zombies) {
            z._comeTogether = false;
            z._actualizarContorno?.(false);
            if (Math.hypot(z.x - this._player.x, z.y - this._player.y) <= Config.comeTogetherRadius) {
                const angle = Utils.angleTo(this._player.x, this._player.y, z.x, z.y);
                z._pushVx          = Math.cos(angle) * Config.comeTogetherForce;
                z._pushVy          = Math.sin(angle) * Config.comeTogetherForce;
                z._ctBoostTimer    = Config.comeTogetherBoostDuration;
                z._ctReducedAttackCD = true;
                if (z.sprite) z.sprite.tint = 0xff4444;
            }
        }

        // 3 rings azules escalonados
        const maxR = Config.comeTogetherRadius * 3.9;
        [0, 6, 12].forEach(offset =>
            _animarRingColor(this._wc, this._player.x, this._player.y, maxR, 0x4488ff, 30, offset)
        );
    }
}

// ── Necrotic Pulses ───────────────────────────────────────────────────────────
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
        const px = this._player.x, py = this._player.y;

        // Visual: fade in rápido, fade out rápido
        const ring = new PIXI.Graphics();
        this._wc.addChild(ring);
        let frame = 0;
        const frames = 18;
        const animar = () => {
            frame++;
            const progress = frame / frames;
            const alpha    = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);
            const radius   = Config.necroticPulseRadius * (0.6 + progress * 0.4);
            ring.clear();
            ring.lineStyle(3, 0x69f0ae, alpha * 0.9);
            ring.beginFill(0x69f0ae, alpha * 0.12);
            ring.drawCircle(px, py, radius);
            ring.endFill();
            if (frame < frames) requestAnimationFrame(animar);
            else { ring.clear(); this._wc.removeChild(ring); }
        };
        requestAnimationFrame(animar);

        _aplicarAUnidades(allHumans, allPolicia, px, py, Config.necroticPulseRadius,
            h => {
                const umbral = (h instanceof Peleador) ? Config.brawlerInfectHits : Config.daggerHitsToInfect;
                h._infeccionAcum   = (h._infeccionAcum || 0) + Config.necroticPulseInfectRate;
                h._necroticSlowed  = true;
                h._actualizarBarraInfeccion?.();
                if (h._infeccionAcum >= umbral) { h._infeccionAcum = 0; h.startInfection(this._wc, zombies); }
            },
            cop => {
                cop._necroticSlowed = true;
                cop._hits -= Config.necroticPulseEnemyDamage / Config.policiaBulletDamage;
                cop._actualizarBarraVida?.();
                if (cop._hits <= 0) cop._dead = true;
            }
        );
    }
}