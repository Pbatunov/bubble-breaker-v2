export class Grid {
    constructor({ canvas, state, config }) {
        this.canvas = canvas;
        this.state = state;
        this.config = config;

        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.cellSize = this.width / config.columns;
        this.radius = this.cellSize / 2;
    }

    getPosition(row, column) {
        return {
            x: column * this.cellSize + this.radius,
            y: row * this.cellSize + this.radius,
        };
    }

    get(index) {
        return this.state.bubbles[index];
    }

    getTop(index) {
        return this.get(index - this.config.columns);
    }

    getBottom(index) {
        return this.get(index + this.config.columns);
    }

    getLeft(index) {
        const bubble = this.get(index);
        const candidate = this.get(index - 1);

        return candidate && candidate.y === bubble?.y
            ? candidate
            : undefined;
    }

    getRight(index) {
        const bubble = this.get(index);
        const candidate = this.get(index + 1);

        return candidate && candidate.y === bubble?.y
            ? candidate
            : undefined;
    }

    saveCoordinates() {
        this.state.coordsGrid = this.state.bubbles.map((bubble) => ({
            x: bubble.x,
            y: bubble.y,
            row: bubble.row,
            column: bubble.column,
            index: bubble.index,
        }));
    }

    recalculate(bubble) {
        bubble?.updateGridPosition(this.cellSize);
    }

    recalculateAll(bubbles) {
        bubbles.forEach((bubble) => {
            this.recalculate(bubble);
        })
    }

    resortBubbles() {
        const { bubbles } = this.state;
        const occupied = new Set();

        bubbles.forEach((bubble) => {
            if (bubble) {
                this.recalculate(bubble);
                occupied.add(`${bubble.row}:${bubble.column}`);
            }
        });

        // Строим актуальный список всех ячеек сетки
        const allCells = [];
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.columns; col++) {
                const pos = this.getPosition(row, col);
                allCells.push({ ...pos, row, column: col });
            }
        }

        const emptyCells = allCells.filter(
            ({ row, column }) => !occupied.has(`${row}:${column}`),
        );

        bubbles
            .filter((bubble) => !bubble)
            .sort((a, b) => a?.index - b?.index)
            .forEach((bubble, index) => {
                const cell = emptyCells[index];
                if (!cell) return;
                bubble?.setPosition(cell.x, cell.y);
                this.recalculate(bubble);
            });

        bubbles.sort((a, b) => a?.index - b?.index);
    }
}
