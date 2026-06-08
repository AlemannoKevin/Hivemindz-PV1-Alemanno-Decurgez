class Obstacle extends GameObject {
    constructor(x, y, worldContainer) {
        super(x, y, worldContainer);
        this.x    = x;
        this.y    = y;
        this.size = Config.obstacleHitboxSize;

        const texture = PIXI.Assets.get('ruinedCar1');
        if (texture) {
            const sprite   = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.width   = this.size * 2;
            sprite.height  = this.size * 2;
            this.container.addChild(sprite);
        } else {
            // Fallback por si el asset no cargó
            const g = new PIXI.Graphics();
            g.beginFill(0x555555);
            g.drawRect(-this.size / 2, -this.size / 2, this.size, this.size);
            g.endFill();
            this.container.addChild(g);
        }

        this.container.x = this.x;
        this.container.y = this.y;
    }
}