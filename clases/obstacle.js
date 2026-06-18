class Obstacle extends GameObject {
    constructor(x, y, worldContainer, spriteAlias = 'ruinedCar1', hitboxSize = Config.obstacleHitboxSize, spriteWidth = null, spriteHeight = null) {
        super(x, y, worldContainer);
        this.x    = x;
        this.y    = y;
        this.size = hitboxSize; // esto sigue siendo lo que usan los boids para repulsión

        const atlas   = PIXI.Assets.get('worldObjects');
        const texture = atlas?.textures?.[spriteAlias] || atlas?.textures?.[spriteAlias + '.png'];
        if (texture) {
            const sprite  = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            // Si se especifica ancho/alto custom, lo usamos; si no, caemos al tamaño por defecto
            sprite.width  = spriteWidth  ?? this.size * 2;
            sprite.height = spriteHeight ?? this.size * 2;
            this.container.addChild(sprite);
        } else {
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