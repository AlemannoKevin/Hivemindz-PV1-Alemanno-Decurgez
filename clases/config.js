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
    brawlerBatForce:     30,
    brawlerBatCooldown:  80,
    brawlerSlowDuration: 50,  
    brawlerSlowFactor:   0.25,  

    // Boids
    boidsSepRadius:   50,     // Separación
    boidsAliRadius:   100,    // Alineación
    boidsCohRadius:   120,    // Cohesión

    // Player
    playerMaxHealth: 10,
    playerSpeed:     2.6,
    aoeRadius:       125,    // Radio del ataque inicial/transformación
    aoeFadeFrames:   30,
    playerDashSpeed:    16,
    playerDashDuration: 25,   
    playerDashCooldown: 150,     

    // Zombies
    zombieSpeed:          1.4,
    zombieSeekRange:      300,   // Radio de detección de humanos en px
    zombieAttackRange:    35,
    zombieAttackCooldown: 250, 

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
    playerBulletCooldown: 175,

    // LMB swarm
    lmbSpeedBoost:        1.5,
    lmbMaxZombies:        20,    // máximo de zombies controlables por LMB a la vez

    // Upgrade: LMB orbit
    orbitSpeedBoost:      1.75,   // multiplicador de velocidad para zombies en órbita
    orbitRadius:          300,   // radio del anillo alrededor del jugador en px
    orbitSpeed:           0.036, // velocidad angular del punto objetivo (rad/frame)

    // Upgrade: RMB dagger
    daggerCooldown:       120,   
    daggerHitsToInfect:   2,     
    daggerPoliceDamage:   0.375,
    daggerSpreadAngle:    0.25,  // ángulo entre proyectiles del burst
    
    // Spontaneous Combustion
    combustionRadius:     90,    // radio de la explosión en px
    combustionPushDist:   400,   // distancia máxima del empuje
    combustionPushSpeed:  6,    // velocidad del zombie empujado
    combustionCooldown:   250,   // frames de cooldown
    combustionPickRange:  120,   // radio para agarrar el zombie más cercano
    combustionDamage:     0.5,   // daño a enemigos (equivale a 2 balas básicas)

    // Poisonous Pit
    pitDuration:          240,   // frames totales del charco (4 segundos a 60fps)
    pitPulses:            4,     // cantidad de pulsos de daño
    pitRadius:            60,    // radio del charco en px
    pitSlowFactor:        0.5,   // multiplicador de velocidad sobre el charco
    pitHumanInfectRate:   0.5,   // infección por pulso (4 pulsos = 2 hits de daga = 1 infección)
    pitEnemyDamage:       0.0625,// daño a enemigos por pulso (1/4 de una bala básica: 0.25/4)
};