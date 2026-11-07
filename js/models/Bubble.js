import {ExplosionParticle} from './ExplosionParticle.js'
import {CONFIG} from '../config.js'

/**
 * Пузырь на поле: позиция, цвет, состояние (лопнул, взрывается, мёртв) и отрисовка.
 */
export class Bubble {
    /**
     * @param {Object} params
     * @param {number} params.x - координата центра по X
     * @param {number} params.y - координата центра по Y
     * @param {number} params.radius - радиус пузыря
     * @param {string} params.fillColor - CSS-цвет заливки (он же цвет частиц взрыва)
     * @param {number} params.type - номер цвета (для поиска групп)
     * @param {number} params.index - индекс в сетке
     * @param {number} params.row - строка в сетке
     * @param {number} params.column - колонка в сетке
     * @param {string} params.imagePath - путь к SVG-картинке пузыря
     * @param {CanvasRenderingContext2D} params.ctx - контекст канваса
     * @param {{strokeColor: string, strokeWidth: number, textFontSize: number, columns: number, rows: number}} params.config - настройки
     * @param {AudioManager} [params.audioManager] - менеджер звука для взрыва
     */
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

        /** Помечен ли пузырь для лопания в текущем ходе. */
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

    /** @returns {number} левый край пузыря */
    get left() {
        return this.x - this.radius;
    }

    /** @returns {number} правый край пузыря */
    get right() {
        return this.x + this.radius;
    }

    /** @returns {number} верхний край пузыря */
    get top() {
        return this.y - this.radius;
    }

    /** @returns {number} нижний край пузыря */
    get bottom() {
        return this.y + this.radius;
    }

    /**
     * Пересчитывает флаги «первый/последний в строке и колонке».
     */
    updateGridFlags() {
        this.firstInRow = this.column === 0;
        this.lastInRow = this.column === this.config.columns - 1;
        this.firstInColumn = this.row === 0;
        this.lastInColumn = this.row === this.config.rows - 1;
    }

    /**
     * Устанавливает координаты центра пузыря (без пересчёта сетки).
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Пересчитывает row, column и index по текущим координатам.
     * @param {number} cellSize - размер ячейки сетки в пикселях
     */
    updateGridPosition(cellSize) {
        this.column = Math.floor(this.x / cellSize);
        this.row = Math.floor(this.y / cellSize);
        this.index = this.row * this.config.columns + this.column;
        this.updateGridFlags();
    }

    /**
     * Запускает взрыв: создаёт частицы цвета пузыря.
     */
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

    /**
     * Один кадр взрыва. Когда частицы закончились, пузырь помечается как мёртвый.
     */
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

    /**
     * Проигрывает звук лопания, если он ещё не проигрывался.
     */
    playSound() {
        if (this.audioManager) {
            this.audioManager.play('pop', 0.7); // Чуть тише, чтобы при серии было приятно
            this.shouldPlaySound = false;       // Сбрасываем флаг, чтобы не сыграть дважды
        }
    }

    /**
     * Рисует пузырь: SVG-картинку, а если её нет — круг, плюс текст. Во время взрыва рисует частицы.
     * @param {CanvasRenderingContext2D} ctx
     */
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
