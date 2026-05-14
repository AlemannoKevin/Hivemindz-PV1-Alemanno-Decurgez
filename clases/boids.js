const Boids = {

    computeSteering(entity, neighbors, weights) {
        const { separationWeight, alignmentWeight, cohesionWeight } = weights;

        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0, aliCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;

        for (const neighbor of neighbors) {
            if (neighbor === entity) continue;

            const dx = entity.x - neighbor.x;
            const dy = entity.y - neighbor.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;

            if (dist < Config.boidsSepRadius) {
                const strength = (Config.boidsSepRadius - dist) / Config.boidsSepRadius;
                sepX += (dx / dist) * strength;
                sepY += (dy / dist) * strength;
                sepCount++;
            }

            if (dist < Config.boidsAliRadius) {
                aliX += neighbor.headingX || 0;
                aliY += neighbor.headingY || 0;
                aliCount++;
            }

            if (dist < Config.boidsCohRadius) {
                cohX += neighbor.x;
                cohY += neighbor.y;
                cohCount++;
            }
        }

        let forceX = 0, forceY = 0;

        if (sepCount > 0) {
            forceX += (sepX / sepCount) * separationWeight;
            forceY += (sepY / sepCount) * separationWeight;
        }
        if (aliCount > 0) {
            const normalized = Utils.normalize(aliX, aliY);
            forceX += normalized.x * alignmentWeight;
            forceY += normalized.y * alignmentWeight;
        }
        if (cohCount > 0) {
            const toCenterX = cohX / cohCount - entity.x;
            const toCenterY = cohY / cohCount - entity.y;
            const normalized = Utils.normalize(toCenterX, toCenterY);
            forceX += normalized.x * cohesionWeight;
            forceY += normalized.y * cohesionWeight;
        }

        return { x: forceX, y: forceY };
    },

    blendWithGoal(goalX, goalY, boidsX, boidsY, goalWeight) {
        const blendWeight = 1 - goalWeight;
        const resultX = goalX * goalWeight + boidsX * blendWeight;
        const resultY = goalY * goalWeight + boidsY * blendWeight;
        return Utils.normalize(resultX, resultY);
    },
};