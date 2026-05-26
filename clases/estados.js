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
        const direction = Boids.blendWithGoal(
            humano._wanderDirX, humano._wanderDirY,
            boidsForce.x, boidsForce.y,
            0.45
        );

        humano.headingX = direction.x;
        humano.headingY = direction.y;
        humano.x += direction.x * Config.humanWalkSpeed * deltaTime;
        humano.y += direction.y * Config.humanWalkSpeed * deltaTime;
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
        const goalX = Math.cos(awayAngle);
        const goalY = Math.sin(awayAngle);

        const boidsForce = Boids.computeSteering(humano, allHumans, {
            separationWeight: 0,
            alignmentWeight:  1.4,
            cohesionWeight:   0.2,
        });
        const direction = Boids.blendWithGoal(goalX, goalY, boidsForce.x, boidsForce.y, 0.7);

        humano.headingX = direction.x;
        humano.headingY = direction.y;
        humano.x += direction.x * Config.humanFleeSpeed * deltaTime;
        humano.y += direction.y * Config.humanFleeSpeed * deltaTime;
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
        const { allZombies, player, deltaTime } = context;

        
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

        const allHumans = context.allHumans || [];
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

        policia.x += policia._wanderDirX * Config.policiaSpeed * deltaTime;
        policia.y += policia._wanderDirY * Config.policiaSpeed * deltaTime;
    }

    exit(policia) { }
}


class PoliciaCombatState {
    enter(policia) {
        if (policia._shootTimer === undefined) policia._shootTimer = 0;
    }

    update(policia, context) {
        const { allZombies, player, balas, worldContainer, deltaTime } = context;

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
            policia.setState(new PoliciaWanderState());
            return;
        }

        let dodgeX = 0, dodgeY = 0;
        for (const zombie of allZombies) {
            const dx   = policia.x - zombie.x;
            const dy   = policia.y - zombie.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.policiaDetectRange) {
                const strength = (Config.policiaDetectRange - dist) / Config.policiaDetectRange;
                dodgeX += (dx / dist) * strength;
                dodgeY += (dy / dist) * strength;
            }
        }
        if (nearestTarget && policia.flipSprite) {
            const facingX = nearestTarget.x - policia.x;
            policia.flipSprite(facingX);
        }
        const dodgeDir = Utils.normalize(dodgeX, dodgeY);
        policia.x += dodgeDir.x * Config.policiaDodgeSpeed * deltaTime;
        policia.y += dodgeDir.y * Config.policiaDodgeSpeed * deltaTime;

        policia._shootTimer -= deltaTime;
        if (policia._shootTimer <= 0 &&
            nearestDist < Config.policiaShootRange) {
            policia._shootTimer = Config.policiaShootCooldown;

            if (policia._setAnimation) {
                policia._setAnimation('attack', false);
                policia.sprite.onComplete = () => {
                    policia._setAnimation('move', true);
                    policia.sprite.onComplete = null;
                };
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

    exit(policia) { }
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
        const direction = Boids.blendWithGoal(
            peleador._wanderDirX, peleador._wanderDirY,
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
        this._swingBat(peleador);
        peleador._batTimer = Config.brawlerBatCooldown;

        if (!peleador._worldContainer) return;
        const ring = new PIXI.Graphics();
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
    }

    _swingBat(peleador) {
        const allZombies = peleador._lastZombies || [];
        for (const zombie of allZombies) {
            const dist = Utils.distance(peleador.x, peleador.y, zombie.x, zombie.y);
            if (dist < Config.brawlerBatRange && dist > 0) {
                const angle     = Utils.angleTo(peleador.x, peleador.y, zombie.x, zombie.y);
                // Closer zombies get pushed harder
                const closeness = 1 - (dist / Config.brawlerBatRange);
                const force     = Config.brawlerBatForce * (0.5 + closeness * 0.5);
                zombie._pushVx  = Math.cos(angle) * force;
                zombie._pushVy  = Math.sin(angle) * force;
                zombie._slowTimer = Config.brawlerSlowDuration;
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
        const direction = Boids.blendWithGoal(
            peleador._wanderDirX, peleador._wanderDirY,
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