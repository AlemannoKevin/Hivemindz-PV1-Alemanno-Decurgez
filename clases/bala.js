class BalaBase extends GameObject {
    constructor(startX, startY, speed, angle, worldContainer) {
        super(startX, startY, worldContainer);
        this.x    = startX;
        this.y    = startY;
        this.vx   = Math.cos(angle) * speed;
        this.vy   = Math.sin(angle) * speed;
        this.dead = false;
        this._wc  = worldContainer;
    }

    _moverYActualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.graphic.x = this.x;
        this.graphic.y = this.y;
    }

    _fueraDeMapa() {
        return this.x < 0 || this.x > Config.worldWidth ||
               this.y < 0 || this.y > Config.worldHeight;
    }

    destroy() { this._wc.removeChild(this.graphic); }
}

// ── Bala del jugador ──────────────────────────────────────────────────────────
class Bala extends BalaBase {
    constructor(startX, startY, angle, worldContainer) {
        super(startX, startY, Config.playerBulletSpeed, angle, worldContainer);
        this.graphic = new PIXI.Graphics();
        this.graphic.beginFill(0x91ff00);
        this.graphic.drawCircle(0, 0, 5);
        this.graphic.endFill();
        this.graphic.lineStyle(1.5, 0x91ff00, 0.6);
        this.graphic.drawCircle(0, 0, 9);
        worldContainer.addChild(this.graphic);
    }

    update(allHumans, worldContainer, zombies) {
        this._moverYActualizar();
        if (this._fueraDeMapa()) { this.dead = true; return; }

        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(this.x, this.y, h.x, h.y) < 20) {
                this._impactarHumano(h, worldContainer, zombies, 1);
                this.dead = true; return;
            }
        }

        for (const cop of (Game.instance?.policia || [])) {
            if (cop._dead) continue;
            if (Utils.distance(this.x, this.y, cop.x, cop.y) < 20) {
                cop.takeDamage();
                this.dead = true; return;
            }
        }
    }

    // Infecta o acumula infección en humanos/brawlers
    _impactarHumano(h, worldContainer, zombies, hits) {
        if (h instanceof Peleador) {
            h._infeccionAcum = (h._infeccionAcum || 0) + hits;
            h._actualizarBarraInfeccion?.();
            if (h._infeccionAcum >= Config.brawlerInfectHits) {
                h._infeccionAcum = 0;
                h.startInfection(worldContainer, zombies);
            }
        } else {
            h.startInfection(worldContainer, zombies);
        }
    }
}

// ── Bala de policía ───────────────────────────────────────────────────────────

class BalaPolicia extends BalaBase {
    constructor(startX, startY, angle, worldContainer, damage = Config.policiaBulletDamage, knockback = Config.policiaKnockback) {
        super(startX, startY, Config.policiaBulletSpeed, angle, worldContainer);
        this._damage    = damage;
        this._knockback = knockback;
        this.graphic = new PIXI.Graphics();
        this.graphic.beginFill(0x00beff);
        this.graphic.drawCircle(0, 0, 4);  
        this.graphic.endFill();
        this.graphic.lineStyle(1.5, 0x00beff, 0.6);
        this.graphic.drawCircle(0, 0, 6);
        worldContainer.addChild(this.graphic);
    }

    update(allZombies, player) {
        this._moverYActualizar();
        if (this._fueraDeMapa()) { this.dead = true; return; }

        for (const zombie of allZombies) {
            if (zombie._dead) continue;
            if (Utils.distance(this.x, this.y, zombie.x, zombie.y) < 16) {
                this._impactarZombie(zombie);
                this.dead = true; return;
            }
        }

        if (player?.isZombie && Utils.distance(this.x, this.y, player.x, player.y) < 20) {
            player.takeDamage();
            this.dead = true;
        }
    }

    _impactarZombie(zombie) {
        const speed    = Math.hypot(this.vx, this.vy);
        const ctActivo = zombie._ctBoostTimer > 0;

        if (!ctActivo) {
            zombie.x += (this.vx / speed) * this._knockback;
            zombie.y += (this.vy / speed) * this._knockback;
            World.clampToBounds(zombie);
        }

        const dmgMult = ctActivo ? Config.comeTogetherDmgReduction : 1;
        zombie._hp    = (zombie._hp ?? 1) - this._damage * dmgMult;

        if (zombie.sprite) {
            zombie.sprite.tint = 0xff0000;
            setTimeout(() => {
                if (!zombie._dead && zombie.sprite) {
                    if (zombie._ctBoostTimer > 0) {
                        zombie.sprite.tint = 0xa600ff;
                    } else {
                        zombie.sprite.tint = 0xffffff;
                        // El glow amarillo lo maneja _actualizarContorno, no el tint
                    }
                }
            }, 150);
        }
        if (zombie._hp <= 0) zombie._dead = true;
    }
}

// ── Bala de la daga ───────────────────────────────────────────────────────────
class BalaDagger extends BalaBase {
    constructor(startX, startY, angle, worldContainer, hitsMap) {
        super(startX, startY, Config.playerBulletSpeed * 1.8, angle, worldContainer);
        this._hitsMap = hitsMap;
        this.graphic  = new PIXI.Graphics();
        this.graphic.beginFill(0x91ff00);
        this.graphic.drawCircle(0, 0, 4);
        this.graphic.endFill();
        this.graphic.lineStyle(1.5, 0x91ff00, 0.7);
        this.graphic.drawCircle(0, 0, 7);
        worldContainer.addChild(this.graphic);
    }

    update(allHumans, worldContainer, zombies) {
        this._moverYActualizar();
        if (this._fueraDeMapa()) { this.dead = true; return; }

        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(this.x, this.y, h.x, h.y) < 20) {
                this._impactarHumano(h, worldContainer, zombies);
                this.dead = true; return;
            }
        }

        for (const cop of (Game.instance?.policia || [])) {
            if (cop._dead) continue;
            if (Utils.distance(this.x, this.y, cop.x, cop.y) < 20) {
                cop._hits -= Config.daggerPoliceDamage / Config.policiaBulletDamage;
                cop._actualizarBarraVida?.();
                if (cop._hits <= 0) cop._dead = true;
                this.dead = true; return;
            }
        }
    }

    _impactarHumano(h, worldContainer, zombies) {
        const hitsNecesarios = (h instanceof Peleador)
            ? Config.daggerHitsToInfect * Config.brawlerInfectHits
            : Config.daggerHitsToInfect;
        if (h._uid === undefined) h._uid = Math.random();
        this._hitsMap[h._uid] = (this._hitsMap[h._uid] || 0) + 1;
        h._infeccionAcum = this._hitsMap[h._uid] / hitsNecesarios * Config.daggerHitsToInfect;
        h._actualizarBarraInfeccion?.();
        if (this._hitsMap[h._uid] >= hitsNecesarios) {
            delete this._hitsMap[h._uid];
            h._infeccionAcum = 0;
            h.startInfection(worldContainer, zombies);
        }
    }
}

// ── Bala del pozo venenoso ────────────────────────────────────────────────────
class BalaPit extends BalaBase {
    constructor(startX, startY, angle, worldContainer) {
        super(startX, startY, Config.playerBulletSpeed, angle, worldContainer);
        this.graphic = new PIXI.Graphics();
        this.graphic.beginFill(0x91ff00);
        this.graphic.drawCircle(0, 0, 5);
        this.graphic.endFill();
        this.graphic.lineStyle(1.5, 0x91ff00, 0.7);
        this.graphic.drawCircle(0, 0, 9);
        worldContainer.addChild(this.graphic);
    }

    update(allHumans, worldContainer, zombies) {
        this._moverYActualizar();

        const impacto =
            this._fueraDeMapa() ||
            allHumans.some(h => !h._infected && Utils.distance(this.x, this.y, h.x, h.y) < 20) ||
            this._impactarEnemigo();

        if (impacto) {
            charcos.push(new CharcoPit(this.x, this.y, worldContainer));
            this.dead = true;
        }
    }

    _impactarEnemigo() {
        for (const cop of (Game.instance?.policia || [])) {
            if (cop._dead) continue;
            if (Utils.distance(this.x, this.y, cop.x, cop.y) < 20) {
                cop._hits -= 1;
                cop._actualizarBarraVida?.();
                if (cop._hits <= 0) cop._dead = true;
                return true;
            }
        }
        return false;
    }
}