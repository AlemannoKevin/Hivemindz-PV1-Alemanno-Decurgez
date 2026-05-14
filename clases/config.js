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
    humanFleeRange:   160,    // Distancia de detección de zombies en px
    humanFleeFrames:  240,    // Duración del escape (4s a 60fps)

    // Boids
    boidsSepRadius:   50,     // Separación
    boidsAliRadius:   100,    // Alineación
    boidsCohRadius:   120,    // Cohesión

    // Player
    playerSpeed:     3.0,
    aoeRadius:       160,    // Radio del ataque inicial/transformación
    aoeFadeFrames:   30,     

    // Zombies
    zombieSpeed:     1.2,
    zombieSeekRange: 300,    // Radio de detección de humanos en px
};