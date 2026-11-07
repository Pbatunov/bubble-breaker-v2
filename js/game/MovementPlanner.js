/**
 * Решает, как двигается один пузырь на текущем кадре: куда, до какой точки
 * и не мешает ли сосед. Сам пузырь и состояние меняются здесь же.
 */
export class MovementPlanner {
    /**
     * @param {Object} params
     * @param {GameState} params.state - состояние игры (цели и отметки движения)
     * @param {Grid} params.grid - геометрия поля для проверки соседей
     */
    constructor({state, grid}) {
        this.state = state;
        this.grid = grid;
    }

    /**
     * Направление движения пузыря по наличию цели.
     * @param {Bubble} bubble
     * @returns {'bottom'|'left'|null} null, если движения нет
     */
    getDirection(bubble) {
        if (this.state.getTarget('bottom', bubble) != null) return 'bottom';
        if (this.state.getTarget('left', bubble) != null) return 'left';
        return null;
    }

    /**
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     * @returns {number|null} координата цели или null, если цели нет
     */
    getTargetPosition(bubble, direction) {

        const target = this.state.getTarget(direction, bubble);
        if (target == null) return null;
        if (direction === 'bottom') return target;  // число — Y-координата
        if (direction === 'left') return target;    // число — X-координата
        return null;
    }

    /**
     * Упирается ли пузырь в соседа в направлении движения.
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     * @returns {boolean}
     */
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

    /**
     * Дошёл ли пузырь до своей цели.
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     * @returns {boolean} true, если цели нет или она достигнута
     */
    hasReachedTarget(bubble, direction) {
        const targetPosition = this.getTargetPosition(bubble, direction);
        if (targetPosition == null) return true;
        if (direction === 'bottom') return bubble.y >= targetPosition;
        if (direction === 'left') return bubble.x <= targetPosition;
        return true;
    }

    /**
     * Ставит пузырь ровно в точку остановки, если он её перескочил.
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     */
    clampToTarget(bubble, direction) {
        const targetPosition = this.getTargetPosition(bubble, direction);

        if (targetPosition == null) return;

        if (direction === 'bottom' && bubble.y > targetPosition) bubble.y = targetPosition;
        if (direction === 'left' && bubble.x < targetPosition) bubble.x = targetPosition;
    }

    /**
     * Сдвигает пузырь на speed пикселей в направлении движения.
     * @param {Bubble} bubble
     * @param {'bottom'|'left'} direction
     * @param {number} speed - шаг в пикселях
     */
    move(bubble, direction, speed) {
        if (direction === 'bottom') bubble.y += speed;
        if (direction === 'left') bubble.x -= speed;
    }

    /**
     * Один шаг движения пузыря.
     * @param {Bubble} bubble
     * @param {number} speed - шаг в пикселях
     * @returns {boolean} true, если пузырь сдвинулся и движение продолжается
     */
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
