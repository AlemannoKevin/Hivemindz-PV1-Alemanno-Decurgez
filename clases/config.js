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
    humanWalkSpeed:  0.9,
    humanFleeSpeed:  2.0,
    humanFleeRange:  180,
    humanFleeFrames: 240,

    // ── Peleador ──────────────────────────────────────────────────────────
    brawlerRatio:        0.15,
    brawlerBatRange:     80,
    brawlerBatForce:     35,
    brawlerBatCooldown:  75,
    brawlerSlowDuration: 50,
    brawlerSlowFactor:   0.5,
    brawlerInfectHits:   2,

    // ── Boids ─────────────────────────────────────────────────────────────
    boidsSepRadius:    50,
    boidsAliRadius:    100,
    boidsCohRadius:    120,
    boidsMaxNeighbors: 25,

    // ── Jugador ───────────────────────────────────────────────────────────
    playerMaxHealth:     10,
    playerSpeed:         2.6,
    aoeRadius:           125,
    aoeFadeFrames:       30,
    playerDashSpeed:     16,
    playerDashDuration:  25,
    playerDashCooldown:  150,
    playerBulletSpeed:   3.1,
    playerBulletCooldown: 120,

    // ── LMB básico (overheat) ─────────────────────────────────────────────
    lmbOverheatMax:      300,
    lmbOverheatCooldown: 360,
    lmbRechargeRate:     0.75,
    lmbSpeedBoost:       1.6,
    lmbMaxZombies:       15,

    // ── Zombies ───────────────────────────────────────────────────────────
    zombieSpeed:          1.4,
    zombieSeekRange:      325,
    zombieAttackRange:    35,
    zombieAttackCooldown: 250,

    // ── Policía ───────────────────────────────────────────────────────────
    policiaCount:        24,
    policiaHits:         3,
    policiaSpeed:        1.5,
    policiaDetectRange:  225,
    policiaShootRange:   225,
    policiaShootCooldown: 90,
    policiaBulletSpeed:  4,
    policiaBulletDamage: 0.25,
    policiaKnockback:    20,
    policiaFollowRange:  250,
    policiaIdealRange:   160,

    // ── SWAT ──────────────────────────────────────────────────────────────
    swatRatio:        0.25,
    swatHits:         6,
    swatSpreadAngle:  0.25,
    swatBulletDamage: 0.5,
    swatKnockback:    30,

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
    pitRadius:           85,
    pitSlowFactor:       0.25,
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
    necroticPulseInterval:    60,
    necroticPulseRadius:      150,
    necroticPulseInfectRate:  0.5,
    necroticPulseEnemyDamage: 0.25,
    necroticPulseSlowFactor:  0.5,
    necroticPlayerSlow:       0.5,

    // ── Waves Mode ────────────────────────────────────────────────────────
    waveDuration:       3600,
    waveEnemyBase:      12,
    waveEnemyGrowth:    0.025,
    waveTotalWaves:     9,
    waveHumanTarget:    250,
    waveUpgradeEvery:   10800,
    waveSwatRatio:      0.25,

    // ── Timer de inicio ───────────────────────────────────────────────────
    startTimerDuration: 900,
};