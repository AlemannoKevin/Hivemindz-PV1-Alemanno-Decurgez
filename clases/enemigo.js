class Policia extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;

        this._wanderTimer = Utils.randomBetween(80, 160);
        this._wanderDirX  = Math.cos(Utils.randomAngle());
        this._wanderDirY  = Math.sin(Utils.randomAngle());
        this._shootTimer  = 0;
        this._hits        = Config.policiaHits;
        this._dead        = false;
        this._iFrames     = 0;

        this._buildVisual();
        this.currentState = null;
        this.setState(new PoliciaWanderState());
    }

    // ── Estado ────────────────────────────────────────────────────────────
    setState(newState) {
        if (this.currentState) this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
    }

    // ── Visual ────────────────────────────────────────────────────────────
    _getAnimations() { return policeAnimations; }
    _getMaxHits()    { return Config.policiaHits; }

    _buildVisual() {
        this.container.removeChildren();
        const anims = this._getAnimations();
        if (anims.move) {
            this.sprite = new PIXI.AnimatedSprite(anims.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.12;
            this.sprite.play();
            this.container.addChild(this.sprite);
        }
        this._crearBarraVida(this._getMaxHits());
    }

    _setAnimation(animName, loop = true) {
        const frames = this._getAnimations()[animName];
        if (!frames || !this.sprite) return;
        if (this.sprite.textures === frames) return;
        this.sprite.textures = frames;
        this.sprite.loop     = loop;
        this.sprite.gotoAndPlay(0);
    }

    flipSprite(headingX) {
        if (!this.sprite || Math.abs(headingX) < 0.1) return;
        this.sprite.scale.x = headingX > 0 ? 1 : -1;
    }

    // ── Barra de vida ─────────────────────────────────────────────────────

    _crearBarraVida(maxHits) {
        this._maxHits = maxHits;
        const { cont, fill } = this._crearBarra(-36, 0x00beff);
        this._barraVida = cont;
        this._barraFill = fill;
    }

    _actualizarBarraVida() {
        if (!this._barraVida) return;
        this._barraVida.visible  = true;
        this._barraFill.width    = 28 * Math.max(0, this._hits / this._maxHits);
    }

    // ── Daño ──────────────────────────────────────────────────────────────
    takeDamage() {
        if (this._iFrames > 0 || this._dead) return;
        this._hits    -= 1;
        this._iFrames  = 60;
        this._actualizarBarraVida();

        if (this.sprite) {
            this.sprite.tint = 0xff0000;
            setTimeout(() => {
                if (!this._dead && this.sprite) this.sprite.tint = 0xffffff;
            }, 150);
        }

        if (this._hits <= 0) {
            this._dead = true;
            this.container.visible = false;
        }
    }

    // ── Flags de frame ────────────────────────────────────────────────────
    _resetFrameFlags() {
        this._pitSlowed      = false;
        this._pitNoAtack     = false;
        this._necroticSlowed = false;
    }

    // ── Update ────────────────────────────────────────────────────────────
    update(allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime) {
        if (this._dead) return;
        this._resetFrameFlags();
        if (this._iFrames > 0) this._iFrames -= deltaTime;
        this.currentState.update(this, { allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime });
        this._applyPush(deltaTime);
        this._clampAndSync();
    }
}

// ── Swat ──────────────────────────────────────────────────────────────────────
class Swat extends Policia {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this._hits = Config.swatHits;
        this._buildVisual();
    }

    _getAnimations() { return agentAnimations; }
    _getMaxHits()    { return Config.swatHits; }

    // Swat dispara en spread de 3 balas
    _shoot(targetX, targetY, balas, worldContainer) {
        const baseAngle = Utils.angleTo(this.x, this.y, targetX, targetY);
        SoundManager.playCooledIfOnScreen('swatShot',this, 300);
        for (const offset of [-Config.swatSpreadAngle, 0, Config.swatSpreadAngle]) {
            balas.push(new BalaPolicia(
                this.x, this.y, baseAngle + offset, worldContainer,
                Config.swatBulletDamage, Config.swatKnockback
            ));
        }
    }
}