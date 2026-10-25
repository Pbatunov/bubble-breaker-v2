export class MovementPlanner {
    constructor({state, grid}) {
        this.state = state;
        this.grid = grid;
    }

    getDirection(bubble) {
        if (this.state.getTarget('bottom', bubble) != null) return 'bottom';
        if (this.state.getTarget('left', bubble) != null) return 'left';
        return null;
    }

    getTargetPosition(bubble, direction) {

        const target = this.state.getTarget(direction, bubble);
        if (target == null) return null;
        if (direction === 'bottom') return target;  // число — Y-координата
        if (direction === 'left') return target;    // число — X-координата
        return null;
    }

    isBlockedByNeighbor(bubble, direction) {
        if (direction === 'bottom') {
            const bottom = this.grid.getBottom(bubble.index);
            return !!bottom && !bottom.checked && bubble.bottom >= bottom.top;
        }

        if (direction === 'left') {
            const left = this.grid.getLeft(bubble.index);
            return !!left && !left.checked && bubble.left <= left.right;
        }
        return false;
    }

    hasReachedTarget(bubble, direction) {
        const targetPosition = this.getTargetPosition(bubble, direction);
        if (targetPosition == null) return true;
        if (direction === 'bottom') return bubble.y >= targetPosition;
        if (direction === 'left') return bubble.x <= targetPosition;
        return true;
    }

    clampToTarget(bubble, direction) {
        const targetPosition = this.getTargetPosition(bubble, direction);

        if (targetPosition == null) return;

        if (direction === 'bottom' && bubble.y > targetPosition) bubble.y = targetPosition;
        if (direction === 'left' && bubble.x < targetPosition) bubble.x = targetPosition;
    }

    move(bubble, direction, speed) {
        if (direction === 'bottom') bubble.y += speed;
        if (direction === 'left') bubble.x -= speed;
    }

    update(bubble, speed) {
        const direction = this.getDirection(bubble);
        if (!direction) {
            this.state.stopMoving(bubble);
            return false;
        }

        this.state.startMoving(bubble, direction);

        if (this.isBlockedByNeighbor(bubble, direction)) {
            this.clampToTarget(bubble, direction);
            this.state.stopMoving(bubble);

            return false;
        }

        if (this.hasReachedTarget(bubble, direction)) {
            this.clampToTarget(bubble, direction);
            this.state.stopMoving(bubble);

            return false;
        }

        this.move(bubble, direction, speed);
        return true;
    }
}
