export class ExplosionParticle {
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

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += this.gravity;
        this.dx *= this.friction;
        this.dy *= this.friction;
        this.alpha -= 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    isActive() {
        return this.alpha > 0;
    }
}
