export class GroupFinder {
    constructor({state, grid}) {
        this.state = state;
        this.grid = grid;
    }

    getSameColorNeighbors(index, bubble, {skipChecked = true} = {}) {
        const candidates = [
            this.grid.getTop(index),
            this.grid.getRight(index),
            this.grid.getBottom(index),
            this.grid.getLeft(index),
        ];

        return candidates.filter(
            (neighbor) =>
                neighbor
                && (!skipChecked || !neighbor.checked)
                && neighbor.type === bubble.type,
        );
    }

    findAndMark(index, {readOnly = false} = {}) {
        const bubble = this.state.bubbles[index];
        if (!bubble || bubble.checked) return false;

        const allNeighbors = this.getSameColorNeighbors(index, bubble, {
            skipChecked: false,
        });

        if (!allNeighbors.length) {
            return false;
        }

        if (readOnly) {
            return true;
        }

        bubble.checked = true;
        bubble.startExplosion();
        this.state.startExploding(bubble);

        const uncheckedNeighbors = this.getSameColorNeighbors(index, bubble);
        uncheckedNeighbors.forEach((neighbor) => {
            this.findAndMark(neighbor.index);
        });

        return true;
    }

    hasGroups() {
        return this.state.bubbles
            .filter((bubble) => bubble && !bubble.checked)
            .some((bubble) => this.findAndMark(bubble.index, {readOnly: true}));
    }

    selectAt(x, y) {
        const bubble = this.state.bubbles.find(
            (item) =>
                item
                && x >= item.left && x <= item.right
                && y >= item.top && y <= item.bottom,
        );
        if (!bubble) return false;

        return this.findAndMark(bubble.index);
    }
}
