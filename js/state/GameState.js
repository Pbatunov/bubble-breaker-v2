export class GameState {
    constructor() {
        this.bubbles = [];
        this.coordsGrid = [];

        this.targets = {
            bottom: new Map(),
            left: new Map(),
        };

        this.moving = new Map();
        this.exploding = new Map();
    }

    resetTargets() {
        this.targets.bottom.clear();
        this.targets.left.clear();
    }

    hasTargets() {
        return this.targets.bottom.size || this.targets.left.size
    }

    resetMovement() {
        this.moving.clear();
    }

    setTarget(direction, bubble, target) {
        this.targets[direction].set(bubble.index, target);
    }

    getTarget(direction, bubble) {
        return this.targets[direction].get(bubble.index);
    }

    startExploding(bubble) {
        this.exploding.set(bubble);
    }

    stopExploding(bubble) {
        this.exploding.delete(bubble);
    }

    startMoving(bubble, direction) {
        this.moving.set(bubble, direction);
    }


    stopMoving(bubble) {
        this.moving.delete(bubble);
    }

    get isAnimating() {
        return this.moving.size > 0;
    }

    get hasFinishedAnimation() {
        return this.moving.size === 0 && this.exploding.size === 0;
    }
}
