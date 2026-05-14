const World = {
    // Fondo placeholder
    buildBackground(worldContainer) {
        const bg = new PIXI.Graphics();

        // Dark background fill
        bg.beginFill(0x0d0d1a);
        bg.drawRect(0, 0, Config.worldWidth, Config.worldHeight);
        bg.endFill();

        bg.lineStyle(1, 0x161628);
        for (let x = 0; x <= Config.worldWidth;  x += 80) {
            bg.moveTo(x, 0); bg.lineTo(x, Config.worldHeight);
        }
        for (let y = 0; y <= Config.worldHeight; y += 80) {
            bg.moveTo(0, y); bg.lineTo(Config.worldWidth, y);
        }

        bg.lineStyle(2, 0x222244);
        bg.drawRect(0, 0, Config.worldWidth, Config.worldHeight);

        worldContainer.addChild(bg);
    },

    clampToBounds(entity, margin = 16) {
        entity.x = Utils.clamp(entity.x, margin, Config.worldWidth  - margin);
        entity.y = Utils.clamp(entity.y, margin, Config.worldHeight - margin);
    },
};