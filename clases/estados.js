// ── Helpers compartidos ───────────────────────────────────────────────────────

function _moverConBoids(entity, allHumans, goalX, goalY, speed, deltaTime, context, boidsCfg = {}) {
    const boidsForce = Boids.computeSteering(entity, allHumans, {
        separationWeight: boidsCfg.sep ?? 0,
        alignmentWeight:  boidsCfg.ali ?? 0.5,
        cohesionWeight:   boidsCfg.coh ?? 0.3,
    });
    const obs    = Utils.repelFromObstacles(entity.x, entity.y, Config.obstacleRepelRadius, Config.obstacleRepelForce);
    const border = Utils.repelFromBorders(entity.x, entity.y, Config.borderRepelMargin, Config.borderRepelForce);
    goalX += obs.x + border.x;
    goalY += obs.y + border.y;
    const dir = Boids.blendWithGoal(goalX, goalY, boidsForce.x, boidsForce.y, 0.45);
    entity.headingX = dir.x;
    entity.headingY = dir.y;
    const pitMult   = context.pitMult   ?? 1;
    const necroMult = context.necroMult ?? 1;
    entity.x += dir.x * speed * deltaTime * pitMult * necroMult;
    entity.y += dir.y * speed * deltaTime * pitMult * necroMult;
}

function _actualizarWander(entity, deltaTime) {
    entity._wanderTimer -= deltaTime;
    if (entity._wanderTimer <= 0) {
        const angle = Utils.randomAngle();
        entity._wanderDirX  = Math.cos(angle);
        entity._wanderDirY  = Math.sin(angle);
        entity._wanderTimer = Utils.randomBetween(80, 160);
    }
}

function _detectarAmenaza(entity, player, allZombies, range) {
    if (player.isZombie && Utils.distance(entity.x, entity.y, player.x, player.y) < range) return true;
    return allZombies.some(z => Utils.distance(entity.x, entity.y, z.x, z.y) < range);
}

function _separarDeAgentes(entity, agentes, allHumans) {
    const sepDist = Config.boidsSepRadius * 1.5;
    for (const other of [...agentes, ...allHumans]) {
        if (other === entity || other._dead || other._infected) continue;
        const dx = entity.x - other.x, dy = entity.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < sepDist) {
            const push = (sepDist - dist) / sepDist * 1.5;
            entity.x += (dx / dist) * push;
            entity.y += (dy / dist) * push;
        }
    }
}

function _getSpeedMults(entity) {
    return {
        pitMult:   entity._pitSlowed      ? Config.pitSlowFactor           : 1,
        necroMult: entity._necroticSlowed  ? Config.necroticPulseSlowFactor : 1,
    };
}

// ── Humano: Wander ────────────────────────────────────────────────────────────

 class HumanoWanderState {
    enter(humano) {
        humano.exclamation.visible = false;
        humano.sprite.tint = 0xffffff;
    }

    update(humano, context) {
        const { allHumans, player, allZombies, deltaTime } = context;

        const threat = (player.isZombie &&
            Utils.distance(humano.x, humano.y, player.x, player.y) < Config.humanFleeRange)
            || allZombies.some(z =>
                Utils.distance(humano.x, humano.y, z.x, z.y) < Config.humanFleeRange);
        if (threat) { humano.setState(new HumanoFleeState()); return; }

        _actualizarWander(humano, deltaTime);
        _moverConBoids(humano, allHumans,
            humano._wanderDirX, humano._wanderDirY,
            Config.humanWalkSpeed, deltaTime, context,
            { sep: 0, ali: Config.boidsHumanWanderAli, coh: Config.boidsHumanWanderCoh });
    }

    exit(humano) {}
}

// ── Humano: Flee ──────────────────────────────────────────────────────────────

class HumanoFleeState {
    enter(humano) {
        humano._fleeTimer    = Config.humanFleeFrames;
        humano._fleeCooldown = Config.humanFleeCooldown || 120;
        humano.exclamation.visible = true;
    }

    update(humano, context) {
        const { allHumans, player, allZombies, deltaTime } = context;

        humano._fleeTimer -= deltaTime;
        if (humano._fleeTimer <= 0) { humano.setState(new HumanoWanderState()); return; }

        // Amenaza más cercana
        let threatX = player.x, threatY = player.y;
        let closestDist = Utils.distance(humano.x, humano.y, player.x, player.y);
        for (const z of allZombies) {
            const d = Utils.distance(humano.x, humano.y, z.x, z.y);
            if (d < closestDist) { closestDist = d; threatX = z.x; threatY = z.y; }
        }

        const awayAngle = Utils.angleTo(threatX, threatY, humano.x, humano.y);
        _moverConBoids(humano, allHumans, Math.cos(awayAngle), Math.sin(awayAngle),
            Config.humanFleeSpeed, deltaTime, context,
            { sep: 0, ali: Config.boidsHumanFleeAli, coh: Config.boidsHumanFleeCoh });
    }

    exit(humano) {
        humano.exclamation.visible = false;
    }
}

// ── Policía: Wander ───────────────────────────────────────────────────────────

class PoliciaWanderState {
    enter(policia) {
        policia._wanderTimer = Utils.randomBetween(80, 160);
    }

    update(policia, context) {
        const { allZombies, allPolicia, allHumans, player, deltaTime } = context;

        _separarDeAgentes(policia, allPolicia, allHumans);

        if (_detectarAmenaza(policia, player, allZombies, Config.policiaDetectRange)) {
            policia.setState(new PoliciaCombatState());
            return;
        }

        // Cohesión hacia humanos cercanos o wander libre
        let cohX = 0, cohY = 0, cohCount = 0;
        for (const h of allHumans) {
            if (h._infected) continue;
            if (Utils.distance(policia.x, policia.y, h.x, h.y) < Config.policiaFollowRange) {
                cohX += h.x; cohY += h.y; cohCount++;
            }
        }

        if (cohCount > 0) {
            const angle = Utils.angleTo(policia.x, policia.y, cohX / cohCount, cohY / cohCount);
            policia._wanderDirX = Math.cos(angle);
            policia._wanderDirY = Math.sin(angle);
        } else {
            _actualizarWander(policia, deltaTime);
        }

        const obs    = Utils.repelFromObstacles(policia.x, policia.y, Config.obstacleRepelRadius, Config.obstacleRepelForce);
        const border = Utils.repelFromBorders(policia.x, policia.y, Config.borderRepelMargin, Config.borderRepelForce);
        policia.x += obs.x + border.x;
        policia.y += obs.y + border.y;

        const { pitMult, necroMult } = _getSpeedMults(policia);
        policia.x += policia._wanderDirX * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        policia.y += policia._wanderDirY * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        policia.flipSprite(policia._wanderDirX);
    }

    exit(policia) {}
}

// ── Policía: Combat ───────────────────────────────────────────────────────────

class PoliciaCombatState {
    enter(policia) {
        if (policia._shootTimer === undefined) policia._shootTimer = 0;
        policia._isShooting = false;
    }

    update(policia, context) {
        const { allZombies, allHumans, player, balas, worldContainer, deltaTime } = context;

        _separarDeAgentes(policia, context.allPolicia || [], allHumans);

        // Encontrar objetivo más cercano
        let nearestTarget = null;
        let nearestDist   = Config.policiaDetectRange * 1.3;
        for (const z of allZombies) {
            const d = Utils.distance(policia.x, policia.y, z.x, z.y);
            if (d < nearestDist) { nearestDist = d; nearestTarget = z; }
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

        const dirX = nearestTarget.x - policia.x;
        if (Math.abs(dirX) > 8) policia.flipSprite(dirX > 0 ? 1 : -1);

        if (policia._isShooting) return;

        // Movimiento hacia rango ideal
        const diff = nearestDist - Config.policiaIdealRange;
        if (Math.abs(diff) > 20) {
            const angle = Utils.angleTo(policia.x, policia.y, nearestTarget.x, nearestTarget.y);
            const dir   = diff > 0 ? 1 : -1;
        const obs    = Utils.repelFromObstacles(policia.x, policia.y, Config.obstacleRepelRadius, Config.obstacleRepelForce);
        const border = Utils.repelFromBorders(policia.x, policia.y, Config.borderRepelMargin, Config.borderRepelForce);
        policia.x += obs.x + border.x;
        policia.y += obs.y + border.y;
            const { pitMult, necroMult } = _getSpeedMults(policia);
            policia.x  += Math.cos(angle) * dir * Config.policiaSpeed * deltaTime * pitMult * necroMult;
            policia.y  += Math.sin(angle) * dir * Config.policiaSpeed * deltaTime * pitMult * necroMult;
        }

        // Disparo
        policia._shootTimer -= deltaTime;
        if (policia._shootTimer <= 0 && nearestDist < Config.policiaShootRange && !policia._pitNoAtack) {
            policia._shootTimer = Config.policiaShootCooldown;
            policia._isShooting = true;

            policia._setAnimation('attack', false);
            policia.sprite.onComplete = () => {
                policia._isShooting = false;
                policia._setAnimation('move', true);
                policia.sprite.onComplete = null;
            };

            if (policia._shoot) {
                policia._shoot(nearestTarget.x, nearestTarget.y, balas, worldContainer);
            } else {
                const angle = Utils.angleTo(policia.x, policia.y, nearestTarget.x, nearestTarget.y);
                balas.push(new BalaPolicia(policia.x, policia.y, angle, worldContainer));
            }
        }
    }

    exit(policia) { policia._isShooting = false; }
}

// ── Peleador: Wander ──────────────────────────────────────────────────────────

class PeleadorWanderState {
    enter(peleador) {}

    update(peleador, context) {
        const { allHumans, deltaTime } = context;
        _actualizarWander(peleador, deltaTime);
        _moverConBoids(peleador, allHumans, peleador._wanderDirX, peleador._wanderDirY,
            Config.humanWalkSpeed, deltaTime, context,
            { sep: 0, ali: Config.boidsHumanWanderAli, coh: Config.boidsHumanWanderCoh });
    }

    exit(peleador) {}
}

// ── Peleador: Attack ──────────────────────────────────────────────────────────

class PeleadorAttackState {
    enter(peleador) {
        if (peleador._pitNoAtack) return;
        peleador._batTimer = Config.brawlerBatCooldown;

        // Animación de ataque
        if (brawlerAnimations.attack && peleador.sprite) {
            peleador.sprite.textures = brawlerAnimations.attack;
            peleador.sprite.loop     = false;
            peleador.sprite.gotoAndPlay(0);
            peleador.sprite.onComplete = () => {
                if (peleador.sprite) {
                    peleador.sprite.textures = brawlerAnimations.move;
                    peleador.sprite.loop     = true;
                    peleador.sprite.gotoAndPlay(0);
                    peleador.sprite.onComplete = null;
                }
            };
        }

        // Ring visual + swing con delay
        if (peleador._worldContainer) {
            setTimeout(() => {
                this._swingBat(peleador);
                this._animarRing(peleador);
            }, 250);
        }
    }

    _animarRing(peleador) {
        const ring = new PIXI.Graphics();
        peleador._worldContainer.addChild(ring);
        const cx = peleador.x, cy = peleador.y;
        let frame = 0;
        const frames = 20;
        const animate = () => {
            frame++;
            const progress = frame / frames;
            const alpha    = 1 - progress;
            ring.clear();
            ring.lineStyle(2, 0xff5e00, alpha);
            ring.beginFill(0xff5e00, alpha * 0.15);
            ring.drawCircle(cx, cy, Config.brawlerBatRange * progress);
            ring.endFill();
            if (frame < frames) requestAnimationFrame(animate);
            else { ring.clear(); peleador._worldContainer.removeChild(ring); }
        };
        requestAnimationFrame(animate);
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
        if (player?.isZombie) {
            const dist = Utils.distance(peleador.x, peleador.y, player.x, player.y);
            if (dist < Config.brawlerBatRange && dist > 0) {
                const angle     = Utils.angleTo(peleador.x, peleador.y, player.x, player.y);
                const closeness = 1 - (dist / Config.brawlerBatRange);
                player._pushVx  = Math.cos(angle) * Config.brawlerBatForce * (0.5 + closeness * 0.5);
                player._pushVy  = Math.sin(angle) * Config.brawlerBatForce * (0.5 + closeness * 0.5);
            }
        }
    }

    update(peleador, context) {
        const { allHumans, allZombies, deltaTime } = context;
        peleador._lastZombies = allZombies;
        peleador._batTimer   -= deltaTime;
        if (peleador._batTimer <= 0) { peleador.setState(new PeleadorWanderState()); return; }
        _actualizarWander(peleador, deltaTime);
        _moverConBoids(peleador, allHumans, peleador._wanderDirX, peleador._wanderDirY,
            Config.humanWalkSpeed, deltaTime, context,
            { sep: 0, ali: Config.boidsHumanWanderAli, coh: Config.boidsHumanWanderCoh });
    }

    exit(peleador) {}
}