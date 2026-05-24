class Policia extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;

        this._wanderTimer  = Utils.randomBetween(80, 160);
        this._wanderDirX   = Math.cos(Utils.randomAngle());
        this._wanderDirY   = Math.sin(Utils.randomAngle());
        this._shootTimer   = 0;

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
        const g = new PIXI.Graphics();
        g.beginFill(0x1a237e);
        g.drawRoundedRect(-11, -14, 22, 26, 4);
        g.endFill();
        g.beginFill(0xffe0b2);
        g.drawCircle(0, -20, 8);
        g.endFill();
        g.beginFill(0x283593);
        g.drawRect(-9, -28, 18, 5);
        g.endFill();
        this.container.addChild(g);
    }

    update(allZombies, player, balas, worldContainer, deltaTime) {
        this.currentState.update(this, { allZombies, player, balas, worldContainer, deltaTime });
        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;
    }
}