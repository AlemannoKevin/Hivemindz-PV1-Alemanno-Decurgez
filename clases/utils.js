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
};