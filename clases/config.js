const Config = {

    //Archivo para cambiar variables relacionadas al gameplay

    // Mundo
    worldWidth:  2700,
    worldHeight: 2025,
    zoom:        1.2,

    // Humanos
    humanCount:       250,
    humanWalkSpeed:   0.9,
    humanFleeSpeed:   2.0,    // Velocidad de escape
    humanFleeRange:   180,    // Distancia de detección de zombies en px
    humanFleeFrames:  240,
    obstacleRepelRadius: 120,  
    obstacleRepelForce:  2.5,   

    // Peleador
    brawlerRatio:        0.2,
    brawlerBatRange:     100,
    brawlerBatForce:     25,
    brawlerBatCooldown:  70,
    brawlerSlowDuration: 100,  
    brawlerSlowFactor:   0.15,  

    // Boids
    boidsSepRadius:   50,     // Separación
    boidsAliRadius:   100,    // Alineación
    boidsCohRadius:   120,    // Cohesión

    // Player
    playerMaxHealth: 8,
    playerSpeed:     2.5,
    aoeRadius:       125,    // Radio del ataque inicial/transformación
    aoeFadeFrames:   30,
    playerDashSpeed:    16,
    playerDashDuration: 25,   
    playerDashCooldown: 180,     

    // Zombies
    zombieSpeed:          1.3,
    zombieSeekRange:      300,   // Radio de detección de humanos en px
    zombieAttackRange:    30,
    zombieAttackCooldown: 300, 

    // Policía
    policiaCount:           12,
    policiaHits:            3,
    policiaSpeed:           1.5,
    policiaDetectRange:     225,
    policiaShootRange:      225,
    policiaDodgeSpeed:      1.5,
    policiaShootCooldown:   70,
    policiaBulletSpeed:     5,
    policiaBulletDamage:    0.25,
    policiaKnockback:       20,
    policiaFollowRange:     250,
    policiaIdealRange:      160,   
    policiaStopToShoot:     true,

    // SWAT
    swatRatio:            0.25,  
    swatSpeed:            1.9,   
    swatHits:             6,     
    swatSpreadAngle:      0.25,  
    swatBulletDamage:     0.5,   
    swatKnockback:        36,    
    
    //Bala
    playerBulletSpeed:    2,
    playerBulletCooldown: 240,

    // LMB swarm
    lmbSpeedBoost:        1.1,
};