class Humano extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;

        this.headingX = 0;
        this.headingY = 0;

        this._wanderTimer = Utils.randomBetween(60, 140);
        this._wanderDirX  = Math.cos(Utils.randomAngle());
        this._wanderDirY  = Math.sin(Utils.randomAngle());
        this._fleeTimer   = 0;

        this._buildVisual();
        this._buildExclamation();

        this.currentState = null;
        this.setState(new HumanoWanderState());
    }

    // ── Estado ────────────────────────────────────────────────────────────
    setState(newState) {
        if (this.currentState) this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
    }

    // ── Visual ────────────────────────────────────────────────────────────
    _buildVisual() {
        this.sprite = new PIXI.AnimatedSprite(humanAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
    }

    _buildExclamation() {
        this.exclamation = new PIXI.Text('!', {
            fontFamily: 'monospace',
            fontSize:   24,
            fontWeight: 'bold',
            fill:       0xff3333,
            dropShadow: true,
            dropShadowColor:    0x000000,
            dropShadowDistance: 2,
        });
        this.exclamation.anchor.set(0.5, 1);
        this.exclamation.position.set(0, -38);
        this.exclamation.visible = false;
        this.container.addChild(this.exclamation);
    }

    flipSprite() {
        if (!this.sprite) return;
        if (Math.hypot(this.headingX, this.headingY) < 0.1) return;
        this.sprite.scale.x = this.headingX > 0.1 ? 1 : this.headingX < -0.1 ? -1 : this.sprite.scale.x;
    }

    // ── Infección ─────────────────────────────────────────────────────────
    startInfection(worldContainer, zombies) {
        if (this._infected) return;
        this._infected = true;

        // Reemplazamos update para solo mantener posición mientras parpadea
        this.update = () => {
            this.container.x = this.x;
            this.container.y = this.y;
        };

        let blinks = 0;
        const blinkInterval = setInterval(() => {
            if (this.sprite) {
                this.sprite.tint = blinks % 2 === 0 ? 0x99ff00: 0xffffff;
            }
            if (++blinks >= 8) {
                clearInterval(blinkInterval);
                this.container.visible = false;
                zombies.push(new Zombie(this.x, this.y, worldContainer));
            }
        }, 200);
    }

    // ── Barra de infección ────────────────────────────────────────────────
    
    _crearBarraInfeccion() {
        const { cont, fill } = this._crearBarra(-42, 0x99ff00);
        this._barraInfeccion = cont;
        this._barraFill      = fill;
    }

    _actualizarBarraInfeccion() {
        if (!this._infeccionAcum || this._infeccionAcum <= 0) {
            if (this._barraInfeccion) this._barraInfeccion.visible = false;
            return;
        }
        if (!this._barraInfeccion) this._crearBarraInfeccion();
        this._barraInfeccion.visible = true;
        const umbral = (this instanceof Peleador) ? Config.brawlerInfectHits : Config.daggerHitsToInfect;
        this._barraFill.width = 28 * Math.min(1, this._infeccionAcum / umbral);
    }

    // ── Flags de frame ────────────────────────────────────────────────────
    _resetFrameFlags() {
        this._pitSlowed      = false;
        this._pitNoAtack     = false;
        this._necroticSlowed = false;
        this._biogolpeado    = false;
    }

    _getSpeedMultipliers() {
        return {
            pitMult:   this._pitSlowed      ? Config.pitSlowFactor           : 1,
            necroMult: this._necroticSlowed  ? Config.necroticPulseSlowFactor : 1,
        };
    }

    _applySeparation(allHumans) {
        for (const other of allHumans) {
            if (other === this) continue;
            const dx   = this.x - other.x;
            const dy   = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius) {
                const push = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                this.x += (dx / dist) * push;
                this.y += (dy / dist) * push;
            }
        }
    }

    // ── Update principal ──────────────────────────────────────────────────
    update(allHumans, player, allZombies, deltaTime) {
        this._resetFrameFlags();
        this._applySeparation(allHumans);

        const { pitMult, necroMult } = this._getSpeedMultipliers();
        this.currentState.update(this, { allHumans, player, allZombies, deltaTime, pitMult, necroMult });

        this.flipSprite();
        this._applyPush(deltaTime);
        this._clampAndSync();
        this._actualizarBarraInfeccion();
    }
}

// ── Peleador ──────────────────────────────────────────────────────────────────
class Peleador extends Humano {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this._worldContainer = worldContainer;
        this.setState(new PeleadorWanderState());
    }

    // Peleador no huye
    setState(newState) {
        if (newState instanceof HumanoFleeState) return;
        super.setState(newState);
    }

    _buildVisual() {
        this.sprite = new PIXI.AnimatedSprite(brawlerAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
    }

    _checkAttack(allZombies, player) {
        if (this.currentState instanceof PeleadorAttackState) return;
        let debeAtacar = allZombies.some(z =>
            Utils.distance(this.x, this.y, z.x, z.y) < Config.brawlerBatRange
        );
        if (!debeAtacar && player.isZombie &&
            Utils.distance(this.x, this.y, player.x, player.y) < Config.brawlerBatRange) {
            debeAtacar = true;
        }
        if (debeAtacar) this.setState(new PeleadorAttackState());
    }

    update(allHumans, player, allZombies, deltaTime) {
        this._resetFrameFlags();

        // Stun
        if (this._stunTimer > 0) {
            this._stunTimer -= deltaTime;
            this._finalizePosition();
            this._actualizarBarraInfeccion();
            return;
        }

        this._applySeparation(allHumans);
        this._checkAttack(allZombies, player);

        const { pitMult, necroMult } = this._getSpeedMultipliers();
        this.currentState.update(this, { allHumans, player, allZombies, deltaTime, pitMult, necroMult });

        this.flipSprite();
        this._applyPush(deltaTime);
        this._clampAndSync();
        this._actualizarBarraInfeccion();
    }
}