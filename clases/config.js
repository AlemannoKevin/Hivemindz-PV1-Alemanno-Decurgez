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
    humanFleeFrames:  240,    // Duración del escape (4s a 60fps)

    // Boids
    boidsSepRadius:   50,     // Separación
    boidsAliRadius:   100,    // Alineación
    boidsCohRadius:   120,    // Cohesión

    // Player
    playerMaxHealth: 8,
    playerSpeed:     2.5,
    aoeRadius:       125,    // Radio del ataque inicial/transformación
    aoeFadeFrames:   30,     

    // Zombies
    zombieSpeed:          1.3,
    zombieSeekRange:      300,   // Radio de detección de humanos en px
    zombieAttackRange:    30,
    zombieAttackCooldown: 300, 

    // Policía
    policiaCount:           8,
    policiaSpeed:           1.2,
    policiaDetectRange:     200,
    policiaShootRange:      220,
    policiaDodgeSpeed:      1.5,
    policiaShootCooldown:   90,
    policiaBulletSpeed:     5,
    policiaBulletDamage:    0.25,
    policiaKnockback:       20,
    
    //Bala
    playerBulletSpeed:    2,
    playerBulletCooldown: 240,
};