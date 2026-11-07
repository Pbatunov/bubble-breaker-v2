/**
 * Частица взрыва пузыря: летит по баллистической траектории, гаснет и исчезает.
 */
export class ExplosionParticle {
    /**
     * @param {number} x - начальная координата X
     * @param {number} y - начальная координата Y
     * @param {string} color - цвет частицы (CSS-цвет)
     * @param {number} radius - радиус частицы в пикселях
     * @param {number} [dx] - начальная скорость по X; если не задана, выбирается случайно
     * @param {number} [dy] - начальная скорость по Y; если не задана, выбирается случайно
     */
    constructor(x, y, color, radius, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;

        this.dx = dx || (Math.random() - 0.3) * 12; // скорость по X
        this.dy = dy || (Math.random() - 0.3) * 12; // скорость по Y

        this.gravity = 0.01;
        this.friction = 1; // замедление
    }

    /**
     * Сдвигает частицу на один кадр и уменьшает прозрачность.
     */
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += this.gravity;
        this.dx *= this.friction;
        this.dy *= this.friction;
        this.alpha -= 0.02;
    }

    /**
     * Рисует частицу в текущей позиции.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    /**
     * @returns {boolean} true, пока частица видима
     */
    isActive() {
        return this.alpha > 0;
    }
}
