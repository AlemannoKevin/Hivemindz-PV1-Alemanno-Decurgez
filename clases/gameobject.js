class GameObject {
    constructor(x, y, worldContainer) {
        this.x = x;
        this.y = y;
        this.container = new PIXI.Container();

        if (worldContainer) {
            worldContainer.addChild(this.container);
        }
    }

    update() { }

    render() {
        this.container.x = this.x;
        this.container.y = this.y;
    }
}