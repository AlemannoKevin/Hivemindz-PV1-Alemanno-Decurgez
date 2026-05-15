const World = {
    
    buildBackground(worldContainer) {

        const texture = PIXI.Assets.get('testBackground');

        //const bg = new PIXI.Sprite(texture);

        const bg = new PIXI.TilingSprite(
            texture,
            Config.worldWidth,
            Config.worldHeight
        );

        bg.tileScale.set(1.5);
        
        //bg.width = Config.worldWidth;
        //bg.height = Config.worldHeight;

        worldContainer.addChild(bg);
    },

    clampToBounds(entity, margin = 16) {
        entity.x = Utils.clamp(entity.x, margin, Config.worldWidth  - margin);
        entity.y = Utils.clamp(entity.y, margin, Config.worldHeight - margin);
    },
};