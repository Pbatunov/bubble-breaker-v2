export class AnimationController {
    constructor({ state, movementPlanner, speed }) {
        this.state = state;
        this.movementPlanner = movementPlanner;
        this.speed = speed;
    }

    update() {
        const movingBubbles = this.getCandidates();

        movingBubbles.forEach((bubble) => {
            this.movementPlanner.update(bubble, this.speed);
        });

        return this.state.hasFinishedAnimation;
    }

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
