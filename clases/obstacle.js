class Obstacle extends GameObject {
    constructor(x, y, worldContainer) {
        super(x, y, worldContainer);
        this.x = x;
        this.y = y;
        this.size = 80; 

        const g = new PIXI.Graphics();
        g.beginFill(0x555555);
        g.drawRect(-this.size / 2, -this.size / 2, this.size, this.size);
        g.endFill();
        g.lineStyle(2, 0x333333);
        g.drawRect(-this.size / 2, -this.size / 2, this.size, this.size);
        this.container.addChild(g);

        this.container.x = this.x;
        this.container.y = this.y;
    }
}