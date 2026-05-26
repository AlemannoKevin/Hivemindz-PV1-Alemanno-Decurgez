/*function createFrames(imageName, frameCount, frameWidth, frameHeight) {
    const baseTexture = PIXI.BaseTexture.from(imageName);
    const frames = [];
    const padding = 4;
    
    for (let i = 0; i < frameCount; i++) {
        const rect = new PIXI.Rectangle((i * frameWidth) + padding, padding, frameWidth - (padding * 2), frameHeight - (padding * 2));
        frames.push(new PIXI.Texture(baseTexture, rect));
    }
    return frames;
}*/

let playerAnimations  = {};
let zeroAnimations    = {};
let humanAnimations   = {};
let brawlerAnimations = {};
let zombieAnimations  = {};
let policeAnimations  = {};
let agentAnimations   = {};

async function setup() {
    
    const spriteSheet = await PIXI.Assets.load('sprites/atlas.json');

    zeroAnimations = {
        move:   spriteSheet.animations['zero_Move/zero_Move'],
        attack: spriteSheet.animations['zero_Attack/zero_Attack'],
        idle:   spriteSheet.animations['zero_Idle/zero_Idle'],
    };

    playerAnimations = {
        move:   spriteSheet.animations['player_Move/player_Move'],
        idle:   spriteSheet.animations['player_Idle/player_Idle'],
    };
    
    humanAnimations = {
        move: spriteSheet.animations['human_Move/human_Move'],
    };

    brawlerAnimations = {
        move: spriteSheet.animations['brawler_Move/brawler_Move'],
        attack: spriteSheet.animations['brawler_Attack/brawler_Attack'],
    }

    zombieAnimations = {
        move:   spriteSheet.animations['zombie_Move/zombie_Move'],
        attack: spriteSheet.animations['zombie_Attack/zombie_Attack'],
    };

    policeAnimations = {
        move: spriteSheet.animations['police_Move/police_Move'],
        attack: spriteSheet.animations['police_Attack/police_Attack'],
    };

    agentAnimations = {
        move: spriteSheet.animations['agent_Move/agent_Move'],
        attack: spriteSheet.animations['agent_Attack/agent_Attack'],
    };
}

