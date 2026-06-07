const World = {
    
    buildBackground(worldContainer) {
        const tex1 = PIXI.Assets.get('testBackground');
        const tex2 = PIXI.Assets.get('testBackground2');

        const tileW = tex1.width  * 1.5;
        const tileH = tex1.height * 1.5;

        const cols = Math.ceil(Config.worldWidth  / tileW) + 1;
        const rows = Math.ceil(Config.worldHeight / tileH) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Alternamos
                const useFirst = (row + col) % 2 === 0;
                const tex      = useFirst ? tex1 : tex2;
                const sprite   = new PIXI.Sprite(tex);
                sprite.x       = col * tileW;
                sprite.y       = row * tileH;
                sprite.width   = tileW;
                sprite.height  = tileH;
                worldContainer.addChild(sprite);
            }
        }
    },

    clampToBounds(entity, margin = 16) {
        entity.x = Utils.clamp(entity.x, margin, Config.worldWidth  - margin);
        entity.y = Utils.clamp(entity.y, margin, Config.worldHeight - margin);
    },
};