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

let brawlerAnimations = {};
let playerAnimations  = {};
let zeroAnimations    = {};
let humanAnimations   = {};
let zombieAnimations  = {};
let policeAnimations  = {};
let agentAnimations   = {};

function trimFrames(frames, trimPx = 1) {
    return frames.map(texture => {
        const orig = texture.frame;
        const trimmed = new PIXI.Rectangle(
            orig.x      + trimPx,
            orig.y      + trimPx,
            orig.width  - trimPx * 2,
            orig.height - trimPx * 2
        );
        return new PIXI.Texture(texture.baseTexture, trimmed);
    });
}

async function setup() {
    
    const spriteSheet = await PIXI.Assets.load('sprites/atlas.json');

    zeroAnimations = {
        move:   trimFrames(spriteSheet.animations['zero_Move/zero_Move'], 1),
        attack: trimFrames(spriteSheet.animations['zero_Attack/zero_Attack'], 1),
        idle:   trimFrames(spriteSheet.animations['zero_Idle/zero_Idle'], 1),
    };

    playerAnimations = {
        move:   trimFrames(spriteSheet.animations['player_Move/player_Move'], 1),
        idle:   trimFrames(spriteSheet.animations['player_Idle/player_Idle'], 1),
    };
    
    humanAnimations = {
        move: trimFrames(spriteSheet.animations['human_Move/human_Move'], 1),
    };

    brawlerAnimations = {
        move: trimFrames(spriteSheet.animations['brawler_Move/brawler_Move'], 1),
        attack: trimFrames(spriteSheet.animations['brawler_Attack/brawler_Attack'], 1),
    }

    zombieAnimations = {
        move:   trimFrames(spriteSheet.animations['zombie_Move/zombie_Move'], 1),
        attack: trimFrames(spriteSheet.animations['zombie_Attack/zombie_Attack'], 1),
    };

    policeAnimations = {
        move: trimFrames(spriteSheet.animations['police_Move/police_Move'], 1),
        attack: trimFrames(spriteSheet.animations['police_Attack/police_Attack'], 1),
    };

    agentAnimations = {
        move: trimFrames(spriteSheet.animations['agent_Move/agent_Move'], 1),
        attack: trimFrames(spriteSheet.animations['agent_Attack/agent_Attack'], 1),
    };
}

