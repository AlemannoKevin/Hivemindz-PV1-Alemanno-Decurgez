class Obstacle extends GameObject {
    constructor(x, y, worldContainer, spriteAlias = 'ruinedCar1', hitboxSize = Config.obstacleHitboxSize) {
        super(x, y, worldContainer);
        this.x    = x;
        this.y    = y;
        this.size = hitboxSize;

        const texture = PIXI.Assets.get(spriteAlias);
        if (texture) {
            const sprite  = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            sprite.width  = this.size * 2;
            sprite.height = this.size * 2;
            this.container.addChild(sprite);
        }

        this.container.x = this.x;
        this.container.y = this.y;
    }
}