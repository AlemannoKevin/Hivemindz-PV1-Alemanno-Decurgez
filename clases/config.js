const Config = {

    //Archivo para cambiar variables relacionadas al gameplay

    // Mundo
    worldWidth:  2700,
    worldHeight: 2025,
    zoom:        1.2,
    zoomMin:     0.8,
    zoomMax:     2,
    zoomSpeed:   0.1,

    // Humanos
    humanCount:          325,
    humanWalkSpeed:      0.9,
    humanFleeSpeed:      2.0,    // Velocidad de escape
    humanFleeRange:      180,    // Distancia de detección de zombies en px
    humanFleeFrames:     240,
    obstacleRepelRadius: 120,  
    obstacleRepelForce:  2.5,   

    // Peleador
    brawlerRatio:        0.15,
    brawlerBatRange:     80,
    brawlerBatForce:     35,
    brawlerBatCooldown:  75,
    brawlerSlowDuration: 50,  
    brawlerSlowFactor:   0.5,
    brawlerInfectHits:   2,    // golpes necesarios para infectar a un brawler  

    // Boids
    boidsSepRadius:    50,     // Separación
    boidsAliRadius:    100,    // Alineación
    boidsCohRadius:    120,    // Cohesión
    boidsMaxNeighbors: 25,     // máximo de vecinos por entidad en boids

    // Player
    playerMaxHealth:     10,
    playerSpeed:         2.6,
    aoeRadius:           125,    // Radio del ataque inicial/transformación
    aoeFadeFrames:       30,
    playerDashSpeed:     16,
    playerDashDuration:  25,   
    playerDashCooldown:  150,
    lmbOverheatMax:      300,  // frames de uso continuo (5 segundos)
    lmbOverheatCooldown: 360,  // frames de cooldown al agotar (6 segundos)
    lmbRechargeRate:     0.75, // velocidad de recarga relativa al agote     

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
    policiaShootCooldown:   90,
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
    swatKnockback:        30,    
    
    //Bala
    playerBulletSpeed:    2.9,
    playerBulletCooldown: 130,

    // LMB swarm
    lmbSpeedBoost:        1.6,
    lmbMaxZombies:        15,    // máximo de zombies controlables por LMB a la vez

    // Biomass Collapse
    bioBallRadius:        70,    // radio de agrupamiento alrededor del zombie central
    bioZombieChaseSpeed:  4,     // velocidad de gather (constante)
    bioCooldown:          600,   // frames de cooldown (10s)
    bioDuration:          450,   // frames activos (7.5s)
    bioZombieCount:       24,    // zombies adicionales al central
    bioPushResist:        0.25,  // reducción de push recibido (75% menos)
    bioDetectBoost:       2.0,   // multiplicador del zombieSeekRange del central
    bioCentralSpeedBoost: 1.8,   // multiplicador de velocidad del zombie central

    // Upgrade: RMB dagger
    daggerCooldown:       75,   
    daggerHitsToInfect:   3,     
    daggerPoliceDamage:   0.375,
    daggerSpreadAngle:    0.125,  // ángulo entre proyectiles del burst
    
    // Spontaneous Combustion
    combustionRadius:     85,    // radio de la explosión en px
    combustionPushDist:   250,   // distancia máxima del empuje
    combustionPushSpeed:  6,    // velocidad del zombie empujado
    combustionCooldown:   300,   // frames de cooldown
    combustionPickRange:  120,   // radio para agarrar el zombie más cercano
    combustionDamage:     0.5,   // daño a enemigos (equivale a 2 balas básicas)

    // Poisonous Pit
    pitDuration:          240,   // frames totales del charco (4 segundos a 60fps)
    pitPulses:            4,     // cantidad de pulsos de daño
    pitRadius:            85,    // radio del charco en px
    pitSlowFactor:        0.25,   // multiplicador de velocidad sobre el charco
    pitHumanInfectRate:   0.5,   // infección por pulso (4 pulsos = 2 hits de daga = 1 infección)
    pitEnemyDamage:       0.125,// daño a enemigos por pulso (1/4 de una bala básica: 0.25/4)
    
    // Come Together
    comeTogetherRadius:      55,    // radio de agrupamiento alrededor del jugador
    comeTogetherDuration:    190,   // frames de gather
    comeTogetherForce:       115,    // fuerza de la explosión final
    comeTogetherZombies:     30,    // máximo zombies convocados
    comeTogetherSpeed:       2.4,   // multiplicador de velocidad hacia el jugador

    // Born Under Punches
    punchCooldown:           100,
    punchWidth:              80,   // ancho del cuadrado (eje perpendicular)
    punchHeight:             100,  // alto del cuadrado (eje de ataque)
    punchDamage:             0.5,
    punchKnockback:          20,
    punchRange:              100,
    punchAngle:              1.2,  // apertura del abanico

    // Waves Mode
    waveDuration:            3600,  // frames por wave (1 minuto a 60fps)
    waveEnemyBase:           12,    // enemigos iniciales (igual que policiaCount)
    waveEnemyGrowth:         0.025, // crecimiento por wave (2.5%)
    waveTotalWaves:          9,     // waves para ganar
    waveHumanTarget:         250,   // humanos a mantener en el mapa
    waveUpgradeEvery:        10800, // frames entre upgrades (3 min)
    waveSwatRatio:           0.25,  // ratio de swats en waves
};