export class Renderer {
    constructor({ canvas, state, animation, onAnimationStop }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        this.animation = animation;
        this.onAnimationStop = onAnimationStop;

        this.wasAnimating = false;
    }

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
