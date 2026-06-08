class HumanoWanderState {
    enter(humano) {
        humano.exclamation.visible = false;
        humano.sprite.tint = 0xffffff;
    }

    update(humano, context) {
        const { allHumans, player, allZombies, deltaTime } = context;
        if (player.isZombie) {
            const distToPlayer = Utils.distance(humano.x, humano.y, player.x, player.y);
            if (distToPlayer < Config.humanFleeRange) {
                humano.setState(new HumanoFleeState());
                return;
            }
        }
        for (const zombie of allZombies) {
            const dz = Utils.distance(humano.x, humano.y, zombie.x, zombie.y);
            if (dz < Config.humanFleeRange) {
                humano.setState(new HumanoFleeState());
                return;
            }
        }

        humano._wanderTimer -= deltaTime;
        if (humano._wanderTimer <= 0) {
            const angle = Utils.randomAngle();
            humano._wanderDirX = Math.cos(angle);
            humano._wanderDirY = Math.sin(angle);
            humano._wanderTimer = Utils.randomBetween(80, 160);
        }

        const boidsForce = Boids.computeSteering(humano, allHumans, {
            separationWeight: 0,
            alignmentWeight:  0.7,
            cohesionWeight:   0.6,
        });

        let goalX = humano._wanderDirX; 
        let goalY = humano._wanderDirY;

        const obstacleForce = Utils.repelFromObstacles(
            humano.x, humano.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );

        goalX += obstacleForce.x;
        goalY += obstacleForce.y;

        const direction = Boids.blendWithGoal(
            goalX, goalY, 
            boidsForce.x, boidsForce.y,
            0.45
        );

        humano.headingX = direction.x;
        humano.headingY = direction.y;
        
        const pitMult     = context.pitMult ?? 1;
        const necroMult   = context.necroMult ?? 1;
        // Aplicamos ambos slows (el más restrictivo gana via multiplicación)
        // NUEVO en HumanoWanderState
        humano.x += direction.x * Config.humanWalkSpeed * deltaTime * pitMult * necroMult;
        humano.y += direction.y * Config.humanWalkSpeed * deltaTime * pitMult * necroMult;
    }

    exit(humano) { }
}


class HumanoFleeState {
    enter(humano) {
        humano._fleeTimer = Config.humanFleeFrames;
        humano._fleeCooldown = Config.humanFleeCooldown || 120;
        humano.exclamation.visible = true;
        humano.sprite.tint = 0xff8a65;
    }

    update(humano, context) {
        const { allHumans, player, allZombies, deltaTime } = context;

        humano._fleeTimer -= deltaTime;
        if (humano._fleeTimer <= 0) {
            humano.setState(new HumanoWanderState());
            return;
        }

        let closestThreatX = player.x;
        let closestThreatY = player.y;
        let closestDist    = Utils.distance(humano.x, humano.y, player.x, player.y);

        for (const zombie of allZombies) {
            const dz = Utils.distance(humano.x, humano.y, zombie.x, zombie.y);
            if (dz < closestDist) {
                closestDist    = dz;
                closestThreatX = zombie.x;
                closestThreatY = zombie.y;
            }
        }

        const awayAngle = Utils.angleTo(closestThreatX, closestThreatY, humano.x, humano.y);
        let goalX = Math.cos(awayAngle);
        let goalY = Math.sin(awayAngle);

        const boidsForce = Boids.computeSteering(humano, allHumans, {
            separationWeight: 0,
            alignmentWeight:  1.4,
            cohesionWeight:   0.2,
        });

        const obstacleForce = Utils.repelFromObstacles(
            humano.x, humano.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );

        goalX += obstacleForce.x;
        goalY += obstacleForce.y;

        const direction = Boids.blendWithGoal(
            goalX, goalY, 
            boidsForce.x, boidsForce.y,
            0.45
        );;

        humano.headingX = direction.x;
        humano.headingY = direction.y;
        const pitMult     = context.pitMult ?? 1;
        const necroMult   = context.necroMult ?? 1;
        // Aplicamos ambos slows (el más restrictivo gana via multiplicación)
        humano.x += direction.x * Config.humanFleeSpeed * deltaTime * pitMult * necroMult;
        humano.y += direction.y * Config.humanFleeSpeed * deltaTime * pitMult * necroMult;
    }

    exit(humano) {
        humano.exclamation.visible = false;
        humano.sprite.tint = 0xffffff;
    }
}

class PoliciaWanderState {
    enter(policia) {
        policia._wanderTimer = Utils.randomBetween(80, 160);
    }

    update(policia, context) {
        const { allZombies, allPolicia, allHumans, player, deltaTime } = context;

        const allAgents = context.allPolicia || [];
        for (const other of [...allAgents, ...allHumans]) {
            if (other === policia || other._dead || other._infected) continue;
            const dx   = policia.x - other.x;
            const dy   = policia.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius * 1.5) {
                const push = (Config.boidsSepRadius * 1.5 - dist) / (Config.boidsSepRadius * 1.5) * 1.5;
                policia.x += (dx / dist) * push;
                policia.y += (dy / dist) * push;
            }
        }
        
        if (player.isZombie) {
            const dp = Utils.distance(policia.x, policia.y, player.x, player.y);
            if (dp < Config.policiaDetectRange) {
                policia.setState(new PoliciaCombatState());
                return;
            }
        }

        for (const zombie of allZombies) {
            const d = Utils.distance(policia.x, policia.y, zombie.x, zombie.y);
            if (d < Config.policiaDetectRange) {
                policia.setState(new PoliciaCombatState());
                return;
            }
        }

        //const allHumans = context.allHumans || [];
        let cohX = 0, cohY = 0, cohCount = 0;
        for (const human of allHumans) {
            if (human._infected) continue;
            const d = Utils.distance(policia.x, policia.y, human.x, human.y);
            if (d < Config.policiaFollowRange) {
                cohX += human.x; cohY += human.y; cohCount++;
            }
        }

        if (cohCount > 0) {
           
            const angle = Utils.angleTo(policia.x, policia.y, cohX / cohCount, cohY / cohCount);
            policia._wanderDirX = Math.cos(angle);
            policia._wanderDirY = Math.sin(angle);
        } else {
            
            policia._wanderTimer -= deltaTime;
            if (policia._wanderTimer <= 0) {
                const angle = Utils.randomAngle();
                policia._wanderDirX = Math.cos(angle);
                policia._wanderDirY = Math.sin(angle);
                policia._wanderTimer = Utils.randomBetween(80, 160);
            }
        }

        const obstacleForce = Utils.repelFromObstacles(
            policia.x, policia.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );
        
        policia.x += obstacleForce.x;
        policia.y += obstacleForce.y;

        const pitMult   = policia._pitSlowed   ? Config.pitSlowFactor        : 1;
        const necroMult = policia._necroticSlowed ? Config.necroticPulseSlowFactor : 1;
        policia.x += policia._wanderDirX * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        policia.y += policia._wanderDirY * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        if (policia.flipSprite) policia.flipSprite(policia._wanderDirX);
    }

    exit(policia) { }
}


class PoliciaCombatState {
    enter(policia) {
        if (policia._shootTimer === undefined) policia._shootTimer = 0;
        policia._isShooting = false;
    }

    update(policia, context) {
        const { allZombies, allHumans, player, balas, worldContainer, deltaTime } = context;

        const allAgents = context.allAgents || [];
        for (const other of [...allAgents, ...allHumans]) {
            if (other === policia || other._dead || other._infected) continue;
            const dx   = policia.x - other.x;
            const dy   = policia.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius * 1.5) {
                const push = (Config.boidsSepRadius * 1.5 - dist) / (Config.boidsSepRadius * 1.5) * 1.5;
                policia.x += (dx / dist) * push;
                policia.y += (dy / dist) * push;
            }
        }

        let nearestTarget = null;
        let nearestDist   = Config.policiaDetectRange * 1.3;

        for (const zombie of allZombies) {
            const d = Utils.distance(policia.x, policia.y, zombie.x, zombie.y);
            if (d < nearestDist) { nearestDist = d; nearestTarget = zombie; }
        }
        if (player.isZombie) {
            const dp = Utils.distance(policia.x, policia.y, player.x, player.y);
            if (dp < nearestDist) { nearestDist = dp; nearestTarget = player; }
        }

        if (!nearestTarget) {
            policia._isShooting = false;
            policia.setState(new PoliciaWanderState());
            return;
        }

        if (policia.flipSprite) {
            const dirX = nearestTarget.x - policia.x;
            if (Math.abs(dirX) > 8) policia.flipSprite(dirX > 0 ? 1 : -1);
        }

        if (policia._isShooting) return;

        const diff = nearestDist - Config.policiaIdealRange;
        if (Math.abs(diff) > 20) {
            const angle = Utils.angleTo(
                policia.x, policia.y,
                nearestTarget.x, nearestTarget.y
            );

            const dir = diff > 0 ? 1 : -1;

            const obstacleForce = Utils.repelFromObstacles(
                policia.x, policia.y,
                Config.obstacleRepelRadius,
                Config.obstacleRepelForce
            );

            policia.x += obstacleForce.x;
            policia.y += obstacleForce.y;

            const pitMult   = policia._pitSlowed      ? Config.pitSlowFactor           : 1;
            const necroMult = policia._necroticSlowed  ? Config.necroticPulseSlowFactor : 1;
            policia.x += Math.cos(angle) * dir * Config.policiaSpeed * deltaTime * pitMult * necroMult;
            policia.y += Math.sin(angle) * dir * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        }

        policia._shootTimer -= deltaTime;
        if (policia._shootTimer <= 0 &&
            nearestDist < Config.policiaShootRange &&
            !policia._pitNoAtack) {
            policia._shootTimer  = Config.policiaShootCooldown;
            policia._isShooting  = true;

            if (policia._setAnimation) {
                policia._setAnimation('attack', false);
                policia.sprite.onComplete = () => {
                    policia._isShooting = false;
                    policia._setAnimation('move', true);
                    policia.sprite.onComplete = null;
                };
            } else {
                policia._isShooting = false;
            }

            if (policia._shoot) {
                policia._shoot(nearestTarget.x, nearestTarget.y, balas, worldContainer);
            } else {
                const angle = Utils.angleTo(
                    policia.x, policia.y,
                    nearestTarget.x, nearestTarget.y
                );
                balas.push(new BalaPolicia(policia.x, policia.y, angle, worldContainer));
            }
        }
    }

    exit(policia) {
        policia._isShooting = false;
    }
}

class PeleadorWanderState {
    enter(peleador) {
        
    }

    update(peleador, context) {
        const { allHumans, deltaTime } = context;

        peleador._wanderTimer -= deltaTime;
        if (peleador._wanderTimer <= 0) {
            const angle = Utils.randomAngle();
            peleador._wanderDirX = Math.cos(angle);
            peleador._wanderDirY = Math.sin(angle);
            peleador._wanderTimer = Utils.randomBetween(80, 160);
        }

        const boidsForce = Boids.computeSteering(peleador, allHumans, {
            separationWeight: 0,
            alignmentWeight:  0.7,
            cohesionWeight:   0.6,
        });

        let goalX = peleador._wanderDirX; 
        let goalY = peleador._wanderDirY;

        const obstacleForce = Utils.repelFromObstacles(
            peleador.x, peleador.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );

        goalX += obstacleForce.x;
        goalY += obstacleForce.y;

        const direction = Boids.blendWithGoal(
            goalX, goalY, 
            boidsForce.x, boidsForce.y,
            0.45
        );

        peleador.headingX = direction.x;
        peleador.headingY = direction.y;
        peleador.x += direction.x * Config.humanWalkSpeed * deltaTime;
        peleador.y += direction.y * Config.humanWalkSpeed * deltaTime;
    }

    exit(peleador) { }
}


class PeleadorAttackState {
    
    enter(peleador) {
        if (peleador._pitNoAtack) return; // el charco bloquea el inicio del ataque
        peleador._batTimer = Config.brawlerBatCooldown;

        if (brawlerAnimations.attack && peleador.sprite) {
            peleador.sprite.textures = brawlerAnimations.attack;
            peleador.sprite.loop     = false;
            peleador.sprite.gotoAndPlay(0);
            peleador.sprite.onComplete = () => {
                if (brawlerAnimations.move && peleador.sprite) {
                    peleador.sprite.textures = brawlerAnimations.move;
                    peleador.sprite.loop     = true;
                    peleador.sprite.gotoAndPlay(0);
                    peleador.sprite.onComplete = null;
                }
            };
        }

        if (peleador._worldContainer) {
            setTimeout(() => {
                this._swingBat(peleador);
                const ring   = new PIXI.Graphics();
                peleador._worldContainer.addChild(ring);
                let frame    = 0;
                const frames = 20;
                const cx     = peleador.x;
                const cy     = peleador.y;
                const animate = () => {
                    frame++;
                    const progress = frame / frames;
                    const radius   = Config.brawlerBatRange * progress;
                    const alpha    = 1 - progress;
                    ring.clear();
                    ring.lineStyle(2, 0xffee58, alpha);
                    ring.beginFill(0xffee58, alpha * 0.15);
                    ring.drawCircle(cx, cy, radius);
                    ring.endFill();
                    if (frame < frames) {
                        requestAnimationFrame(animate);
                    } else {
                        ring.clear();
                        peleador._worldContainer.removeChild(ring);
                    }
                };
                requestAnimationFrame(animate);
            }, 250);
        }
    }

        

     _swingBat(peleador) {
        const allZombies = peleador._lastZombies || [];
        for (const zombie of allZombies) {
            const dist = Utils.distance(peleador.x, peleador.y, zombie.x, zombie.y);
            if (dist < Config.brawlerBatRange && dist > 0) {
                const angle     = Utils.angleTo(peleador.x, peleador.y, zombie.x, zombie.y);
                const closeness = 1 - (dist / Config.brawlerBatRange);
                const force     = Config.brawlerBatForce * (0.5 + closeness * 0.5);
                const knockMult = (zombie._ctBoostTimer > 0) ? Config.comeTogetherDmgReduction : 1;
                zombie._pushVx  = Math.cos(angle) * force * knockMult;
                zombie._pushVy  = Math.sin(angle) * force * knockMult;
                if (!zombie._ctBoostTimer || zombie._ctBoostTimer <= 0) {
                    zombie._slowTimer = Config.brawlerSlowDuration;
                }
            }
        }

        const player = Game.instance?.player;
        if (player && player.isZombie) {
            const dist = Utils.distance(peleador.x, peleador.y, player.x, player.y);
            if (dist < Config.brawlerBatRange && dist > 0) {
                const angle     = Utils.angleTo(peleador.x, peleador.y, player.x, player.y);
                const closeness = 1 - (dist / Config.brawlerBatRange);
                const force     = Config.brawlerBatForce * (0.5 + closeness * 0.5);
                player._pushVx  = Math.cos(angle) * force;
                player._pushVy  = Math.sin(angle) * force;
            }
        }
    }


    update(peleador, context) {
        const { allHumans, allZombies, deltaTime } = context;

        peleador._lastZombies = allZombies;

        peleador._batTimer -= deltaTime;

        if (peleador._batTimer <= 0) {
            peleador.setState(new PeleadorWanderState());
            return;
        }

        peleador._wanderTimer -= deltaTime;
        if (peleador._wanderTimer <= 0) {
            const angle = Utils.randomAngle();
            peleador._wanderDirX = Math.cos(angle);
            peleador._wanderDirY = Math.sin(angle);
            peleador._wanderTimer = Utils.randomBetween(80, 160);
        }

        const boidsForce = Boids.computeSteering(peleador, allHumans, {
            separationWeight: 0,
            alignmentWeight:  0.7,
            cohesionWeight:   0.6,
        });

        let goalX = peleador._wanderDirX; 
        let goalY = peleador._wanderDirY;

        const obstacleForce = Utils.repelFromObstacles(
            peleador.x, peleador.y,
            Config.obstacleRepelRadius,
            Config.obstacleRepelForce
        );

        goalX += obstacleForce.x;
        goalY += obstacleForce.y;

        const direction = Boids.blendWithGoal(
            goalX, goalY, 
            boidsForce.x, boidsForce.y,
            0.45
        );

        peleador.headingX = direction.x;
        peleador.headingY = direction.y;
        peleador.x += direction.x * Config.humanWalkSpeed * deltaTime;
        peleador.y += direction.y * Config.humanWalkSpeed * deltaTime;
    }

    exit(peleador) { }
}