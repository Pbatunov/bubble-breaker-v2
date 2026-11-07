/**
 * Двигает пузыри, у которых есть цели движения, на один кадр.
 */
export class AnimationController {
    /**
     * @param {Object} params
     * @param {GameState} params.state - состояние игры
     * @param {MovementPlanner} params.movementPlanner - планировщик движения одного пузыря
     * @param {number} params.speed - шаг движения за кадр, пикселей
     */
    constructor({ state, movementPlanner, speed }) {
        this.state = state;
        this.movementPlanner = movementPlanner;
        this.speed = speed;
    }

    /**
     * Один кадр анимации: двигает все пузыри, у которых есть цели.
     * @returns {boolean} true, если анимация полностью завершена
     */
    update() {
        const movingBubbles = this.getCandidates();

        movingBubbles.forEach((bubble) => {
            this.movementPlanner.update(bubble, this.speed);
        });

        return this.state.hasFinishedAnimation;
    }

    /**
     * Пузыри, у которых есть цель движения вниз или влево.
     * @returns {Array<Bubble>}
     */
    getCandidates() {
        return this.state.bubbles.filter((bubble) => {
            if (!bubble || bubble.checked) return false;
            return (
                this.state.getTarget('bottom', bubble) != null
                || this.state.getTarget('left', bubble) != null
            );
        });
    }
}
