const Config = {

    // ── Mundo ─────────────────────────────────────────────────────────────
    worldWidth:  2700,
    worldHeight: 2025,
    zoom:        1.2,
    zoomMin:     0.8,
    zoomMax:     2,
    zoomSpeed:   0.1,

    // ── Obstáculos ────────────────────────────────────────────────────────
    obstacleHitboxSize:  80,
    obstacleRepelRadius: 120,
    obstacleRepelForce:  2.5,

    // ── Humanos ───────────────────────────────────────────────────────────
    humanCount:      325,
    humanWalkSpeed:  0.8,
    humanFleeSpeed:  1.8,
    humanFleeRange:  180,
    humanFleeFrames: 240,

    // ── Peleador ──────────────────────────────────────────────────────────
    brawlerRatio:        0.15,
    brawlerBatRange:     90,
    brawlerBatForce:     40,
    brawlerBatCooldown:  70,
    brawlerSlowDuration: 75,
    brawlerSlowFactor:   0.5,
    brawlerInfectHits:   2,

    // ── Boids ─────────────────────────────────────────────────────────────
    boidsSepRadius:    50,
    boidsAliRadius:    100,
    boidsCohRadius:    120,
    boidsMaxNeighbors: 25,

    // ── Jugador ───────────────────────────────────────────────────────────
    playerMaxHealth:     12,
    playerSpeed:         2.8,
    aoeRadius:           125,
    aoeFadeFrames:       30,
    playerDashSpeed:     18,
    playerDashDuration:  25,
    playerDashCooldown:  150,
    playerBulletSpeed:   3.5,
    playerBulletCooldown: 110,

    // ── Zombies ───────────────────────────────────────────────────────────
    zombieSpeed:          1.6,
    zombieSeekRange:      325,
    zombieAttackRange:    35,
    zombieAttackCooldown: 150,

    // ── Policía ───────────────────────────────────────────────────────────
    policiaCount:        40,
    policiaHits:         3,
    policiaSpeed:        1.7,
    policiaDetectRange:  225,
    policiaShootRange:   225,
    policiaShootCooldown: 90,
    policiaBulletSpeed:  4,
    policiaBulletDamage: 0.2,
    policiaKnockback:    3,
    policiaFollowRange:  250,
    policiaIdealRange:   160,

    // ── SWAT ──────────────────────────────────────────────────────────────
    swatRatio:        0.3,
    swatHits:         5,
    swatSpreadAngle:  0.3,
    swatBulletDamage: 0.3,
    swatKnockback:    45,

    // ── LMB básico (overheat) ─────────────────────────────────────────────
    lmbOverheatMax:      300,
    lmbOverheatCooldown: 360,
    lmbRechargeRate:     0.75,
    lmbSpeedBoost:       1.8,
    lmbMaxZombies:       20,

    // ── Habilidad: Biomass Collapse ───────────────────────────────────────
    bioBallRadius:        70,
    bioZombieChaseSpeed:  4,
    bioCooldown:          600,
    bioDuration:          450,
    bioZombieCount:       24,
    bioPushResist:        0.25,
    bioDetectBoost:       2.0,
    bioCentralSpeedBoost: 1.8,

    // ── Habilidad: Putrified Daggers ──────────────────────────────────────
    daggerCooldown:      75,
    daggerHitsToInfect:  3,
    daggerPoliceDamage:  0.375,
    daggerSpreadAngle:   0.125,

    // ── Habilidad: Kick-Start Combustion ──────────────────────────────────
    combustionRadius:    85,
    combustionPushDist:  250,
    combustionPushSpeed: 6,
    combustionCooldown:  300,
    combustionPickRange: 120,
    combustionDamage:    0.5,

    // ── Habilidad: Poisonous Pit ──────────────────────────────────────────
    pitDuration:         240,
    pitPulses:           4,
    pitRadius:           95,
    pitSlowFactor:       0.15,
    pitHumanInfectRate:  0.5,
    pitEnemyDamage:      0.125,

    // ── Habilidad: Come Together ──────────────────────────────────────────
    comeTogetherRadius:             55,
    comeTogetherDuration:           190,
    comeTogetherForce:              115,
    comeTogetherZombies:            30,
    comeTogetherSpeed:              2.4,
    comeTogetherBoostDuration:      200,
    comeTogetherSpeedBoost:         2.25,
    comeTogetherDmgReduction:       0.5,
    comeTogetherAttackCooldownMult: 0.25,

    // ── Habilidad: Necrotic Pulses ────────────────────────────────────────
    necroticPulseInterval:    50,
    necroticPulseRadius:      185,
    necroticPulseInfectRate:  0.2,
    necroticPulseEnemyDamage: 0.1,
    necroticPulseSlowFactor:  0.5,
    necroticPlayerSlow:       0.25,

    // ── Waves Mode ────────────────────────────────────────────────────────
    waveDuration:       1800,
    waveEnemyBase:      12,
    waveEnemyGrowth:    0.025,
    waveTotalWaves:     8,
    waveHumanTarget:    250,
    waveUpgradeEvery:   3600,
    waveSwatRatio:      0.25,
    
    // ── HUD: colores ──────────────────────────────────────────────────────
    colorLMB:             '#ffee00',  // amarillo brillante para todas las LMB
    colorRMB:             '#15ff00',  // verde brillante para todas las RMB
    colorDash:            '#ffb74d',  // naranja para el dash
    colorHealthFull:      '#850a0a',
    colorHealthMid:       '#850a0a',
    colorHealthLow:       '#184219',
    colorXPBar:           '#0717f1',
    colorPopHumans:       '#0fb2e4',  // azul claro
    colorPopZombies:      '#2e7d32',  // verde oscuro
    colorPopForces:       '#0c3583',  // azul oscuro

    // ── HUD: textos ───────────────────────────────────────────────────────
    labelHealth:          'HEALTH',
    labelXP:              'XP',
    labelLMB:             'LMB',
    labelRMB:             'RMB',
    labelDash:            'DASH',
    labelPopHumans:       'HUMANS',
    labelPopZombies:      'ZOMBIES',
    labelPopForces:       'POLICE',
    hudFontSize:          25,    // tamaño de fuente del HUD en px
    hudFontSizeLarge:     25,    // tamaño para labels de habilidades
    colorControlled:      '#ffee88',  // hue amarillo claro para zombies controlados por LMB

    // ── HUD: tamaños ──────────────────────────────────────────────────────
    hudBarWidth:          300,   // ancho de las barras de salud y XP en px
    hudCooldownRadius:    60,    // radio de los círculos de cooldown en px

    // ── XP / niveles ──────────────────────────────────────────────────────
    xpLevel1:             25,    // infectados para el primer nivel
    xpLevel2:             125,   // infectados acumulados para el segundo nivel
    xpLevel3:             225,   // infectados acumulados para el tercer nivel

    // ── Timer de inicio ───────────────────────────────────────────────────
    startTimerDuration: 900,
};