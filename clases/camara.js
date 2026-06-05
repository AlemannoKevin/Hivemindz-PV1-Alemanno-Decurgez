class Camara {
    constructor(worldContainer) {
        this.container = worldContainer;
        this.offsetX   = 0;
        this.offsetY   = 0;
    }

    followTarget(targetX, targetY) {
        const z = Config.zoom;
        const rawX = window.innerWidth  / 2 - targetX * z;
        const rawY = window.innerHeight / 2 - targetY * z;

        this.offsetX = Utils.clamp(rawX, window.innerWidth  - Config.worldWidth  * z, 0);
        this.offsetY = Utils.clamp(rawY, window.innerHeight - Config.worldHeight * z, 0);

        this.container.scale.set(z);
        this.container.x = this.offsetX;
        this.container.y = this.offsetY;
    }

    ajustarZoom(delta) {
        Config.zoom = Utils.clamp(
            Config.zoom - delta * Config.zoomSpeed,
            Config.zoomMin,
            Config.zoomMax
        );
    }
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / Config.zoom,
            y: (screenY - this.offsetY) / Config.zoom,
        };
    }
}