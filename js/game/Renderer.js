/**
 * Отрисовка кадра: вызывает анимацию, обновляет взрывы и рисует все пузыри.
 */
export class Renderer {
    /**
     * @param {Object} params
     * @param {HTMLCanvasElement} params.canvas - канвас для отрисовки
     * @param {GameState} params.state - состояние игры
     * @param {AnimationController} params.animation - контроллер движения
     * @param {() => void} [params.onAnimationStop] - вызывается, когда анимация только что завершилась
     */
    constructor({ canvas, state, animation, onAnimationStop }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        this.animation = animation;
        this.onAnimationStop = onAnimationStop;

        this.wasAnimating = false;
    }

    /**
     * Один кадр: обновляет анимацию и перерисовывает все пузыри.
     */
    render() {
        const { ctx } = this;

        this.animation.update();

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.state.bubbles.forEach((bubble) => {
            if (!bubble) return;

            if (bubble.isExploding) {
                bubble.updateExplosion();
            }

            if (!bubble.isExploding) {
                this.state.stopExploding(bubble);
            }

            bubble.draw(ctx);
        });

        const isAnimating = this.state.isAnimating;

        if (this.wasAnimating && this.state.hasFinishedAnimation) {
            this.wasAnimating = false;
            if (this.onAnimationStop) {
                this.onAnimationStop();
            }
        }

        if (isAnimating) {
            this.wasAnimating = true;
        }
    }
}
