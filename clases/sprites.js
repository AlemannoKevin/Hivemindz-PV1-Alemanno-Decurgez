function createFrames(imageName, frameCount, frameWidth, frameHeight) {
    const baseTexture = PIXI.BaseTexture.from(imageName);
    const frames = [];
    const padding = 4;
    
    for (let i = 0; i < frameCount; i++) {
        const rect = new PIXI.Rectangle((i * frameWidth) + padding, padding, frameWidth - (padding * 2), frameHeight - (padding * 2));
        frames.push(new PIXI.Texture(baseTexture, rect));
    }
    return frames;
}

let playerAnimations = {};
let zeroAnimations = {};
let humanAnimations = {};
let zombieAnimations = {};

async function setup() {
    await PIXI.Assets.load(['sprites/zero_Move.png', 'sprites/zero_Attack.png',
        'sprites/zero_Idle.png', 'sprites/human_Move.png', 'sprites/player_Move.png',
        'sprites/player_Idle.png', 
        'sprites/zombie_Move.png', 'sprites/zombie_Attack.png']);

    zeroAnimations = {
        move: createFrames('sprites/zero_Move.png', 6, 73, 73),
        attack: createFrames('sprites/zero_Attack.png', 6, 73, 73),
        idle: createFrames('sprites/zero_Idle.png', 6, 73, 73)
    };

    playerAnimations = {
        move: createFrames('sprites/player_Move.png', 6, 73, 73),
        idle: createFrames('sprites/player_Idle.png', 4, 73, 73)
    };
    
    humanAnimations = {
        move: createFrames('sprites/human_Move.png', 6, 73, 73),
    };
    
    zombieAnimations = {
        move: createFrames('sprites/zombie_Move.png', 6, 73, 73),
        attack: createFrames('sprites/zombie_Attack.png', 6, 73, 73)
    };
}

