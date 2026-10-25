import {ExplosionParticle} from './ExplosionParticle.js'
import {CONFIG} from '../config.js'


export class Bubble {
    constructor({
                    x,
                    y,
                    radius,
                    fillColor,
                    type,
                    colorText,
                    index,
                    row,
                    column,
                    imagePath,
                    ctx,
                    config,
                    audioManager,
                }) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fillColor = fillColor;
        this.type = type;
        this.index = index;
        this.row = row;
        this.column = column;

        this.checked = false;

        this.strokeColor = config.strokeColor;
        this.strokeWidth = config.strokeWidth;
        this.text = '';
        this.textFontSize = config.textFontSize;
        this.config = config;
        this.audioManager = audioManager;

        // Путь к SVG (например, assets/images/bubbles/red.svg)
        this.image = new Image();
        this.image.src = imagePath;

        this.explosionParticles = [];
        this.isExploding = false;
        this.isDead = false;
        this.explosionDuration = 0;

        this.updateGridFlags();
    }

    get left() {
        return this.x - this.radius;
    }

    get right() {
        return this.x + this.radius;
    }

    get top() {
        return this.y - this.radius;
    }

    get bottom() {
        return this.y + this.radius;
    }

    updateGridFlags() {
        this.firstInRow = this.column === 0;
        this.lastInRow = this.column === this.config.columns - 1;
        this.firstInColumn = this.row === 0;
        this.lastInColumn = this.row === this.config.rows - 1;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    updateGridPosition(cellSize) {
        this.column = Math.floor(this.x / cellSize);
        this.row = Math.floor(this.y / cellSize);
        this.index = this.row * this.config.columns + this.column;
        this.updateGridFlags();
    }

    startExplosion() {
        this.isExploding = true;
        this.explosionParticles = [];

        this.shouldPlaySound = true; // Помечаем, что звук нужен

        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 5;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const radius = Math.random() * 10 + 1;
            const color = this.fillColor;

            this.explosionParticles.push(
                new ExplosionParticle(this.x, this.y, color, radius, dx, dy)
            );
        }
    }

    updateExplosion() {
        if (!this.isExploding) return;

        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            this.explosionParticles[i].update();
            if (!this.explosionParticles[i].isActive()) {
                this.explosionParticles.splice(i, 1);
            }
        }

        if (this.explosionParticles.length === 0) {
            this.isExploding = false;
            this.isDead = true;


            // Здесь можно пометить пузырь как «уничтоженный» для удаления из логики игры
        }
    }

    playSound() {
        if (this.audioManager) {
            this.audioManager.play('pop', 0.7); // Чуть тише, чтобы при серии было приятно
            this.shouldPlaySound = false;       // Сбрасываем флаг, чтобы не сыграть дважды
        }
    }

    // В Bubble.js
    draw(ctx) {
        if (!ctx) return;

        if (this.isExploding) {
            this.explosionParticles.forEach(p => p.draw(ctx));
            return;
        }

        // Если взрыв кончился, но пузырь помечен как мертвый -> ничего не рисуем.
        // Объект остается в массиве, чтобы мы могли проверить длину частиц снаружи.
        if (this.isDead) {
            return;
        }

        if (!this.image || !this.image.complete || this.image.naturalWidth === 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.fillColor;
            ctx.fill();

            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            if (this.strokeWidth) {
                ctx.stroke();
            }

            ctx.closePath();
        } else {
            const drawSize = this.radius * 2;
            // Центрируем SVG по координатам (x, y)
            ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, drawSize, drawSize);
        }

        // Текст
        ctx.beginPath();
        ctx.font = `${this.textFontSize}px serif`;
        ctx.fillStyle = '#000';

        const textWidth = ctx.measureText(this.text).width;

        ctx.fillText(
            this.text,
            this.x - textWidth / 2,
            this.y + this.textFontSize / 4,
        );

        ctx.closePath();
    }
}
