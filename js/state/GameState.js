/**
 * Состояние игрового поля: пузыри, цели движения, текущее движение и взрывы.
 * Хранит только данные, логику анимации здесь нет.
 */
export class GameState {
    constructor() {
        /** @type {Array<Bubble|null>} пузыри по индексу сетки */
        this.bubbles = [];
        /** @type {Array<{x: number, y: number, row: number, column: number, index: number}>} исходные координаты */
        this.coordsGrid = [];

        /** Цели движения: направление -> (индекс пузыря -> координата). */
        this.targets = {
            bottom: new Map(),
            left: new Map(),
        };

        /** Пузыри, которые сейчас движутся: пузырь -> направление. */
        this.moving = new Map();
        /** Пузыри, которые сейчас взрываются. */
        this.exploding = new Map();
    }

    /**
     * Очищает все цели движения.
     */
    resetTargets() {
        this.targets.bottom.clear();
        this.targets.left.clear();
    }

    /**
     * @returns {boolean} есть ли хотя бы одна цель движения
     */
    hasTargets() {
        return this.targets.bottom.size || this.targets.left.size
    }

    /**
     * Очищает список движущихся пузырей.
     */
    resetMovement() {
        this.moving.clear();
    }

    /**
     * Задаёт цель движения пузыря.
     * @param {'bottom'|'left'} direction
     * @param {Bubble} bubble
     * @param {number} target - координата цели (Y для bottom, X для left)
     */
    setTarget(direction, bubble, target) {
        this.targets[direction].set(bubble.index, target);
    }

    /**
     * @param {'bottom'|'left'} direction
     * @param {Bubble} bubble
     * @returns {number|undefined} цель движения или undefined, если её нет
     */
    getTarget(direction, bubble) {
        return this.targets[direction].get(bubble.index);
    }

    /**
     * Отмечает пузырь как взрывающийся.
     * @param {Bubble} bubble
     */
    startExploding(bubble) {
        this.exploding.set(bubble);
    }

    /**
     * Снимает отметку взрыва с пузыря.
     * @param {Bubble} bubble
     */
    stopExploding(bubble) {
        this.exploding.delete(bubble);
    }

    /**
     * Отмечает пузырь как движущийся в заданном направлении.
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     */
    startMoving(bubble, direction) {
        this.moving.set(bubble, direction);
    }


    /**
     * Снимает отметку движения с пузыря.
     * @param {Bubble} bubble
     */
    stopMoving(bubble) {
        this.moving.delete(bubble);
    }

    /**
     * @returns {boolean} идёт ли движение или взрыв
     */
    get isAnimating() {
        return this.moving.size > 0 || this.exploding.size > 0;
    }

    /**
     * @returns {boolean} все движения и взрывы завершены
     */
    get hasFinishedAnimation() {
        return this.moving.size === 0 && this.exploding.size === 0;
    }
}
