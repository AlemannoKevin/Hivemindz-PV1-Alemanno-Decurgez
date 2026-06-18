const Config = {

    // ── Mundo ─────────────────────────────────────────────────────────────
    worldWidth:  2700,
    worldHeight: 2025,
    zoom:        1.2,
    zoomMin:     0.8,
    zoomMax:     2,
    zoomSpeed:   0.1,
    borderRepelMargin: 200,   // grosor del borde invisible en px
    borderRepelForce:  7,   // fuerza de repulsión del borde

    // ── Obstáculos ────────────────────────────────────────────────────────
    obstacleHitboxSize:  80,
    obstacleRepelRadius: 120,
    obstacleRepelForce:  2.5,

    // ── Humanos ───────────────────────────────────────────────────────────
    humanCount:      325,
    humanWalkSpeed:  0.8,
    humanFleeSpeed:  1.75,
    humanFleeRange:  170,
    humanFleeFrames: 240,

    // ── Peleador ──────────────────────────────────────────────────────────
    brawlerRatio:        0.15,
    brawlerBatRange:     90,
    brawlerBatForce:     35,
    brawlerBatCooldown:  75,
    brawlerSlowDuration: 75,
    brawlerSlowFactor:   0.5,
    brawlerInfectHits:   2,

    // ── Boids ─────────────────────────────────────────────────────────────
    boidsSepRadius:    50,
    boidsAliRadius:    80,
    boidsCohRadius:    90,
    boidsMaxNeighbors: 20,
    boidsHumanWanderAli:  0.6,
    boidsHumanWanderCoh:  0.40,
    boidsHumanFleeAli:    1.2,
    boidsHumanFleeCoh:    0.15,

    // ── Jugador ───────────────────────────────────────────────────────────
    playerMaxHealth:      14,
    playerSpeed:          2.8,
    aoeRadius:            175,
    aoeFadeFrames:        30,
    playerDashSpeed:      18,
    playerDashDuration:   25,
    playerDashCooldown:   150,
    playerBulletSpeed:    3.75,
    playerBulletCooldown: 100,

    // ── Zombies ───────────────────────────────────────────────────────────
    zombieSpeed:          1.5,
    zombieSeekRange:      325,
    zombieAttackRange:    35,
    zombieAttackCooldown: 175,

    // ── Policía ───────────────────────────────────────────────────────────
    policiaCount:        50,
    policiaHits:         3,
    policiaSpeed:        1.6,
    policiaDetectRange:  200,
    policiaShootRange:   200,
    policiaShootCooldown: 80,
    policiaBulletSpeed:  3.5,
    policiaBulletDamage: 0.15,
    policiaKnockback:    2.5,
    policiaFollowRange:  250,
    policiaIdealRange:   160,

    // ── SWAT ──────────────────────────────────────────────────────────────
    swatRatio:        0.15,
    swatHits:         5,
    swatSpreadAngle:  0.3,
    swatBulletDamage: 0.2,
    swatKnockback:    45,

    // ── LMB básico (overheat) ─────────────────────────────────────────────
    lmbOverheatMax:      300,
    lmbOverheatCooldown: 360,
    lmbRechargeRate:     0.75,
    lmbSpeedBoost:       2,
    lmbMaxZombies:       20,

    // ── Habilidad: Biomass Collapse ───────────────────────────────────────
    bioBallRadius:        75,
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
    combustionRadius:    100,
    combustionPushDist:  275,
    combustionPushSpeed: 6,
    combustionCooldown:  200,
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
    comeTogetherRadius:             60,
    comeTogetherDuration:           225,
    comeTogetherForce:              115,
    comeTogetherZombies:            40,
    comeTogetherSpeed:              2.4,
    comeTogetherBoostDuration:      200,
    comeTogetherSpeedBoost:         2.25,
    comeTogetherDmgReduction:       0.5,
    comeTogetherAttackCooldownMult: 0.25,

    // ── Habilidad: Necrotic Pulses ────────────────────────────────────────
    necroticPulseInterval:    50,
    necroticPulseRadius:      200,
    necroticPulseInfectRate:  0.5,
    necroticPulseEnemyDamage: 0.2,
    necroticPulseSlowFactor:  0.5,
    necroticPlayerSlow:       0.25,
    necroticPushResist:       0.25,  // multiplicador de push recibido (75% menos)
    necroticDmgMitig:         0.25,  // multiplicador de daño recibido (75% menos)
    necroticSlowToggle:       0.4,  // multiplicador de velocidad cuando está ON
    necroticDashRedux:        0.25,  // multiplicador de cooldown de dash cuando ON

    // ── Hivemind ──────────────────────────────────────────────────────────
    hivemindRingInner:        100,   // distancia mínima del anillo al jugador
    hivemindRingWidth:        100,   // grosor del anillo
    hivemindGatherDuration:   150,
    hivemindActiveDuration:   600,
    hivemindCooldown:         600,
    hivemindGatherSpeed:      5.0,
    hivemindActiveSpeed:      4.0,
    hivemindSpawnCount:       25,
    hivemindZombieCount:      50,    // máximo total de zombies en el anillo
    hivemindContactInfectRate: 0.2,  // % de infección por segundo en contacto
    hivemindContactDamageRate: 0.2,  // % de vida por segundo en contacto

    // ── Elite Reinforcements ──────────────────────────────────────────────
    eliteCount:               5,     // zombies spawneados
    eliteDuration:            475,   // frames de vida
    eliteCooldown:            450,   // frames de cooldown

    // ── Spawns post-upgrade ───────────────────────────────────────────────
    upgradeZombieSpawn:       10,    // zombies que spawnan tras elegir habilidad
    upgradeEnemyTarget:       50,    // enemigos objetivo tras upgrade (normal)
    upgradeEnemyTargetFinal:  75,    // enemigos objetivo en el último upgrade
    upgradeZombieCap:         200,   // cap de zombies en waves mode

    // ── HUD upgrade screen ────────────────────────────────────────────────
    
    upgradeCardWidth:         320,
    upgradeCardFontTitle:     22,
    upgradeCardFontDesc:      15,
    upgradeCardFontType:      14,
    upgradeScreenTitleSize:   40,

    // ── Waves HUD ─────────────────────────────────────────────────────────
    waveCounterFontSize:      18,

    // ── Waves Mode ────────────────────────────────────────────────────────
    waveDuration:       1800,
    waveEnemyBase:      12,
    waveEnemyGrowth:    0.075,
    waveTotalWaves:     8,
    waveHumanTarget:    100,
    waveUpgradeEvery:   3600,
    waveSwatRatio:      0.3,
    
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
    labelHealth:            'HEALTH',
    labelXP:                'XP',
    labelLMB:               'LMB',
    labelRMB:               'RMB',
    labelDash:              'DASH',
    labelPopHumans:         'HUMANS',
    labelPopZombies:        'ZOMBIES',
    labelPopForces:         'POLICE',
    hudFontSize:            25,    // tamaño de fuente del HUD en px
    hudFontSizeLarge:       18,    // tamaño para labels de habilidades
    colorControlled:        '#fffb00',  // hue amarillo claro para zombies controlados por LMB
    controlledZombieScaleX: 1.1,  // escala horizontal del glow
    controlledZombieScaleY: 1.1,  // escala vertical del glow

    // ── HUD: tamaños ──────────────────────────────────────────────────────
    hudBarWidth:          300,   // ancho de las barras de salud y XP en px
    hudCooldownRadius:    50,    // radio de los círculos de cooldown en px

    // ── XP / niveles ──────────────────────────────────────────────────────
    xpLevel1:             25,    // infectados para el primer nivel
    xpLevel2:             125,   // infectados acumulados para el segundo nivel
    xpLevel3:             225,   // infectados acumulados para el tercer nivel

    // ── Timer de inicio ───────────────────────────────────────────────────
    startTimerDuration: 900,
    fixedStepMS:       16.6667,  // duración de un paso de simulación (60 pasos/seg)
    maxFrameTimeMS:    250,      // tope de tiempo real acumulable por frame (evita catch-up masivo)
    maxStepsPerFrame:  5,        // máximo de pasos de simulación por frame de render
};