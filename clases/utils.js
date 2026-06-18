const Utils = {
    // Distancia entre 2 puntos
    distance(ax, ay, bx, by) {
        return Math.hypot(bx - ax, by - ay);
    },

    // Ángulo radial entre 2 puntos
    angleTo(ax, ay, bx, by) {
        return Math.atan2(by - ay, bx - ax);
    },

    // Encerrar un número entre un min y un max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Valor random entre un min y un max
    randomBetween(lo, hi) {
        return lo + Math.random() * (hi - lo);
    },

    // Ángulo random en radianes
    randomAngle() {
        return Math.random() * Math.PI * 2;
    },

    // Normalizar vector 2D
    normalize(dx, dy) {
        const length = Math.hypot(dx, dy);
        return length > 0 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
    },

    repelFromPoint(entityX, entityY, pointX, pointY, radius, force) {
        const dx   = entityX - pointX;
        const dy   = entityY - pointY;
        const dist = Math.hypot(dx, dy);
        if (dist === 0 || dist >= radius) return { x: 0, y: 0 };
        const strength = (radius - dist) / radius * force;
        const norm     = Utils.normalize(dx, dy);
        return { x: norm.x * strength, y: norm.y * strength };
    },

    repelFromObstacles(entityX, entityY, radius, force) {
        let totalX = 0, totalY = 0;
        const instance = Game.instance;
        if (!instance) return { x: 0, y: 0 };

        const obstacles = instance._obstacles || [];
        for (const obs of obstacles) {
            if (!obs) continue;
            const f = Utils.repelFromPoint(entityX, entityY, obs.x, obs.y, radius, force);
            totalX += f.x;
            totalY += f.y;
        }
        return { x: totalX, y: totalY };
    },
    
    repelFromBorders(entityX, entityY, margin, force) {
        let fx = 0, fy = 0;
        const w = Config.worldWidth, h = Config.worldHeight;

        if (entityX < margin)     fx += (margin - entityX) / margin * force;
        if (entityX > w - margin) fx -= (entityX - (w - margin)) / margin * force;
        if (entityY < margin)     fy += (margin - entityY) / margin * force;
        if (entityY > h - margin) fy -= (entityY - (h - margin)) / margin * force;

        return { x: fx, y: fy };
    },
};