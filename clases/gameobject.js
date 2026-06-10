class GameObject {
    constructor(x, y, worldContainer) {
        this.x = x;
        this.y = y;
        this.container = new PIXI.Container();
        if (worldContainer) worldContainer.addChild(this.container);
    }

    // ── Posición ──────────────────────────────────────────────────────────
    _syncContainer() {
        this.container.x = this.x;
        this.container.y = this.y;
    }

    _clampAndSync() {
        World.clampToBounds(this);
        this._syncContainer();
    }

    // ── Push físico compartido ────────────────────────────────────────────
    _applyPush(deltaTime) {
        if (!this._pushVx && !this._pushVy) return;
        this.x       += this._pushVx * deltaTime;
        this.y       += this._pushVy * deltaTime;
        this._pushVx *= 0.85;
        this._pushVy *= 0.85;
        if (Math.abs(this._pushVx) < 0.05) this._pushVx = 0;
        if (Math.abs(this._pushVy) < 0.05) this._pushVy = 0;
    }

    // ── Barras PIXI genéricas ─────────────────────────────────────────────
    // Devuelve { contenedor, fill } — el caller los guarda como quiera
    _crearBarra(offsetY, fillColor, width = 28, height = 4) {
        const cont = new PIXI.Container();
        cont.position.set(-width / 2, offsetY);
        cont.visible = false;

        const fondo = new PIXI.Graphics();
        fondo.beginFill(0x222222, 0.7);
        fondo.drawRect(0, 0, width, height);
        fondo.endFill();

        const fill = new PIXI.Graphics();
        fill.beginFill(fillColor);
        fill.drawRect(0, 0, width, height);
        fill.endFill();

        cont.addChild(fondo);
        cont.addChild(fill);
        this.container.addChild(cont);
        return { cont, fill };
    }

    update() {}
    render() { this._syncContainer(); }
}