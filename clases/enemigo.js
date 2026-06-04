class Policia extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;

        this._wanderTimer  = Utils.randomBetween(80, 160);
        this._wanderDirX   = Math.cos(Utils.randomAngle());
        this._wanderDirY   = Math.sin(Utils.randomAngle());
        this._shootTimer   = 0;
        this._hits = Config.policiaHits;  // hits remaining before death
        this._dead = false;

        this._iFrames = 0;

        this._buildVisual();

        this.currentState = null;
        this.setState(new PoliciaWanderState());
    }

    setState(newState) {
        if (this.currentState) this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
    }

    _buildVisual() {
        this.container.removeChildren();

        if (policeAnimations.move) {
            this.sprite = new PIXI.AnimatedSprite(policeAnimations.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.12;
            this.sprite.play();
            this.container.addChild(this.sprite);
        }

        this._crearBarraVida(Config.policiaHits);
    }

    _crearBarraVida(maxHits) {
        this._maxHits = maxHits;
        const cont = new PIXI.Container();
        cont.position.set(-14, -36);
        cont.visible = false;

        const fondo = new PIXI.Graphics();
        fondo.beginFill(0x222222, 0.7);
        fondo.drawRect(0, 0, 28, 4);
        fondo.endFill();

        this._barraFill = new PIXI.Graphics();
        this._barraFill.beginFill(0xff4444);
        this._barraFill.drawRect(0, 0, 28, 4);
        this._barraFill.endFill();

        cont.addChild(fondo);
        cont.addChild(this._barraFill);
        this._barraVida = cont;
        this.container.addChild(cont);
    }

    _actualizarBarraVida() {
        if (!this._barraVida) return;
        this._barraVida.visible = true;
        const pct = Math.max(0, this._hits / this._maxHits);
        this._barraFill.width = 28 * pct;
    }

    takeDamage() {
        if (this._iFrames > 0 || this._dead) return;
        this._hits -= 1;
        this._iFrames = 60;
        this._actualizarBarraVida();

        if (this.container.children[0]) {
            this.container.children[0].tint = 0xff4444;
            setTimeout(() => {
                if (!this._dead && this.container.children[0])
                    this.container.children[0].tint = 0xffffff;
            }, 150);
        }

        if (this._hits <= 0) {
            this._dead = true;
            this.container.visible = false;
        }
    }

    _setAnimation(animName, loop = true) {
        const frames = policeAnimations[animName];
        if (!frames || !this.sprite) return;
        if (this.sprite.textures === frames) return;
        this.sprite.textures = frames;
        this.sprite.loop     = loop;
        this.sprite.gotoAndPlay(0);
    }

    flipSprite(headingX) {
        if (!this.sprite) return;
        if (Math.abs(headingX) < 0.1) return; // ignore tiny values
        if (headingX > 0)  this.sprite.scale.x =  1;
        else               this.sprite.scale.x = -1;
    }

    update(allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime) {
        if (this._dead) return;
        this._pitSlowed  = false;
        this._pitNoAtack = false;
        if (this._iFrames > 0) this._iFrames -= deltaTime;
        this.currentState.update(this, { allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime });
        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;
    }
}

class Swat extends Policia {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this._hits = Config.swatHits;

        this._buildVisual();
    }

    _buildVisual() {
        this.container.removeChildren();
        if (agentAnimations.move) {
            this.sprite = new PIXI.AnimatedSprite(agentAnimations.move);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.12;
            this.sprite.play();
            this.container.addChild(this.sprite);
        }
        this._crearBarraVida(Config.swatHits);
    }

    _setAnimation(animName, loop = true) {
        const frames = agentAnimations[animName];
        if (!frames || !this.sprite) return;
        if (this.sprite.textures === frames) return;
        this.sprite.textures = frames;
        this.sprite.loop     = loop;
        this.sprite.gotoAndPlay(0);
    }

    update(allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime) {
        if (this._dead) return;
        this._pitSlowed  = false;
        this._pitNoAtack = false;
        if (this._iFrames > 0) this._iFrames -= deltaTime;

        this._lastContext = { allZombies, allHumans, player, balas, worldContainer, deltaTime };
        this.currentState.update(this, { allZombies, allHumans, allPolicia, player, balas, worldContainer, deltaTime });

        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;
    }

    _shoot(targetX, targetY, balas, worldContainer) {
        const baseAngle = Utils.angleTo(this.x, this.y, targetX, targetY);
        const angles    = [
            baseAngle - Config.swatSpreadAngle,
            baseAngle,
            baseAngle + Config.swatSpreadAngle,
        ];
        for (const angle of angles) {
            const bala       = new BalaPolicia(this.x, this.y, angle, worldContainer);
            bala._damage     = Config.swatBulletDamage;
            bala._knockback  = Config.swatKnockback;
            balas.push(bala);
        }
    }
}