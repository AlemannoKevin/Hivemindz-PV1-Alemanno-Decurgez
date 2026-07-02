const Config = {

    scoreKey: 'hivemindz_highscore',

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
    humanCount:      250,
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
    boidsSepRadius:       50,
    boidsAliRadius:       80,
    boidsCohRadius:       90,
    boidsMaxNeighbors:    20,
    boidsHumanWanderAli:  0.6,
    boidsHumanWanderCoh:  0.40,
    boidsHumanFleeAli:    1.2,
    boidsHumanFleeCoh:    0.15,

    // ── Jugador ───────────────────────────────────────────────────────────
    playerMaxHealth:      14,
    playerSpeed:          2.9,
    aoeRadius:            175,
    aoeFadeFrames:        30,
    playerDashSpeed:      16,
    playerDashDuration:   20,
    playerDashCooldown:   150,
    playerBulletSpeed:    4.5,
    playerBulletCooldown: 100,

    // ── Zombies ───────────────────────────────────────────────────────────
    zombieSpeed:          1.5,
    zombieSeekRange:      325,
    zombieAttackRange:    35,
    zombieAttackCooldown: 175,

    // ── Policía ───────────────────────────────────────────────────────────
    policiaCount:        40,
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
    daggerCooldown:      60,
    daggerHitsToInfect:  2,
    daggerPoliceDamage:  0.375,
    daggerSpreadAngle:   0.135,

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
    comeTogetherForce:              90,
    comeTogetherZombies:            40,
    comeTogetherSpeed:              4,
    comeTogetherBoostDuration:      200,
    comeTogetherSpeedBoost:         2.25,
    comeTogetherDmgReduction:       0.5,
    comeTogetherAttackCooldownMult: 0.25,

    // ── Habilidad: Necrotic Pulses ────────────────────────────────────────
    necroticPulseInterval:    50,
    necroticPulseRadius:      210,
    necroticPulseInfectRate:  0.5,
    necroticPulseEnemyDamage: 0.2,
    necroticPulseSlowFactor:  0.5,
    necroticPlayerSlow:       0.5,
    necroticPushResist:       0.25,  // multiplicador de push recibido (75% menos)
    necroticDmgMitig:         0.25,  // multiplicador de daño recibido (75% menos)
    necroticSlowToggle:       0.4,  // multiplicador de velocidad cuando está ON
    necroticDashRedux:        0.25,  // multiplicador de cooldown de dash cuando ON

    // ── Habilidad: Hivemind ──────────────────────────────────────────────────────────
    hivemindRingInner:         125,   // distancia mínima del anillo al jugador
    hivemindRingWidth:         75,   // grosor del anillo
    hivemindGatherDuration:    175,
    hivemindActiveDuration:    500,
    hivemindCooldown:          600,
    hivemindGatherSpeed:       5.0,
    hivemindActiveSpeed:       5.0,
    hivemindSpawnCount:        25,
    hivemindZombieCount:       50,    // máximo total de zombies en el anillo
    hivemindContactInfectRate: 0.35,  // % de infección por segundo en contacto
    hivemindContactDamageRate: 0.35,  // % de vida por segundo en contacto

    // ── Habilidad: Elite Reinforcements ──────────────────────────────────────────────
    eliteCount:               4,     // zombies spawneados
    eliteDuration:            500,   // frames de vida
    eliteCooldown:            450,   // frames de cooldown

    // ── Bonificaciones permanentes ────────────────────────────────────────
    bonusSpeedMult:        1.5,    // +50% velocidad
    bonusCooldownMult:     0.75,   // 25% reducción de cooldown
    bonusDamageShield:     0.5,    // 50% reducción de daño
    bonusEliteCount:       5,      // zombies elite que spawnea el bonus

    // ── Spawns post-upgrade ───────────────────────────────────────────────
    upgradeZombieSpawn:       15,    // zombies que spawnan tras elegir habilidad
    upgradeEnemyTarget:       40,    // enemigos objetivo tras upgrade (normal)
    upgradeEnemyTargetFinal:  50,    // enemigos objetivo en el último upgrade
    upgradeZombieCap:         150,   // cap de zombies en waves mode

    // ── HUD upgrade screen ────────────────────────────────────────────────
    
    upgradeCardWidth:         320,
    upgradeCardFontTitle:     28,
    upgradeCardFontDesc:      20,
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
    colorLMB:             '#ffffff', 
    colorRMB:             '#91ff00', 
    colorDash:            '#ffffff',  
    colorHealthFull:      '#fffb00',
    colorHealthMid:       '#fffb00',
    colorHealthLow:       '#fffb00',
    colorXPBar:           '#fffb00',
    colorPopHumans:       '#ff7300',  
    colorPopZombies:      '#99ff00',  
    colorPopForces:       '#00beff',  

    // ── HUD: textos ───────────────────────────────────────────────────────
    labelHealth:            'HEALTH',
    labelXP:                'XP',
    labelLMB:               'LEFT CLICK',
    labelRMB:               'RIGHT CLICK',
    labelDash:              'DASH',
    labelPopHumans:         'HUMANS',
    labelPopZombies:        'ZOMBIES',
    labelPopForces:         'POLICE',
    hudFontSize:            25,    // tamaño de fuente del HUD en px
    hudFontSizeLarge:       18,    // tamaño para labels de habilidades
    colorControlled:        '#ffffff',  // hue amarillo claro para zombies controlados por LMB
    controlledZombieScaleX: 1.2,  // escala horizontal del glow
    controlledZombieScaleY: 1.2,  // escala vertical del glow

    // ── HUD: tamaños ──────────────────────────────────────────────────────
    hudBarWidth:          300,   // ancho de las barras de salud y XP en px
    hudCooldownRadius:    60,    // radio de los círculos de cooldown en px

    // ── XP / niveles ──────────────────────────────────────────────────────
    xpLevel1:             20,    // infectados para el primer nivel
    xpLevel2:             90,    // infectados acumulados para el segundo nivel
    xpLevel3:             150,   // infectados acumulados para el tercer nivel

    // ── Timer de inicio ───────────────────────────────────────────────────
    startTimerDuration: 900,
    fixedStepMS:       16.6667,  // duración de un paso de simulación (60 pasos/seg)
    maxFrameTimeMS:    250,      // tope de tiempo real acumulable por frame (evita catch-up masivo)
    maxStepsPerFrame:  5,        // máximo de pasos de simulación por frame de render
};