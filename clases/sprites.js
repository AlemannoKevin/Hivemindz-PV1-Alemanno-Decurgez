function createFrames(imageName, frameCount) {
    const baseTexture = PIXI.BaseTexture.from(imageName);
    const frameWidth = 73;
    const frameHeight = 73;
    const frames = [];
    const padding = 4;
    
    for (let i = 0; i < frameCount; i++) {
        const rect = new PIXI.Rectangle((i * frameWidth) + padding, padding, frameWidth - (padding * 2), frameHeight - (padding * 2));
        frames.push(new PIXI.Texture(baseTexture, rect));
    }
    return frames;
}

let zeroAnimations = {};

async function setup() {
    await PIXI.Assets.load(['sprites/zero_Move.png', 'sprites/zero_Attack.png', 'sprites/zero_Idle.png']);

    zeroAnimations = {
        move: createFrames('sprites/zero_Move.png', 6),
        attack: createFrames('sprites/zero_Attack.png', 6),
        idle: createFrames('sprites/zero_Idle.png', 6)
    };
}

