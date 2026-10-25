export class CollapseCalculator {
    constructor({ state, grid, config }) {
        this.state = state;
        this.grid = grid;
        this.config = config;
    }

    reset() {
        this.state.resetTargets();
    }

    calculate(checkedBubbles) {
        const fallingBubbles = [];
        const collapseBubbles = [];

        this.calculateVerticalTargets(checkedBubbles, fallingBubbles);

        if (!fallingBubbles.length) {
            this.calculateHorizontalTargets(collapseBubbles);
        }

        return { fallingBubbles, collapseBubbles };
    }

    calculateVerticalTargets(checkedBubbles, fallingBubbles) {
        const { bubbles } = this.state;
        const { columns, rows } = this.config;
        const { cellSize, radius } = this.grid;

        const checkedColumns = new Set(
            checkedBubbles.map((bubble) => bubble.column)
        );

        checkedColumns.forEach((col) => {
            const checkedBelow = new Array(rows).fill(0);
            let count = 0;

            // Подсчёт удаляемых пузырей снизу вверх.
            for (let row = rows - 1; row >= 0; row -= 1) {
                const bubble = bubbles[row * columns + col];

                checkedBelow[row] = count;

                if (bubble?.checked) {
                    count += 1;
                }
            }

            // Расчёт конечных позиций оставшихся пузырей.
            for (let row = 0; row < rows; row += 1) {
                const bubble = bubbles[row * columns + col];

                if (!bubble || bubble.checked) {
                    continue;
                }

                const fallBy = checkedBelow[row];

                if (fallBy === 0) {
                    continue;
                }

                if (!fallingBubbles.includes(bubble)) {
                    fallingBubbles.push(bubble);
                }

                const targetRow = row + fallBy;
                const targetY = targetRow * cellSize + radius;

                this.state.setTarget('bottom', bubble, targetY);
            }
        });
    }

    calculateHorizontalTargets(collapseBubbles) {
        const { bubbles } = this.state;
        const { columns, rows } = this.config;
        const cellSize = this.grid.cellSize;
        const radius = this.grid.radius;

        // Находим полностью пустые колонки
        const emptyColumns = new Set();
        for (let col = 0; col < columns; col++) {
            let isEmpty = true;
            for (let row = 0; row < rows; row++) {
                const bubble = bubbles[row * columns + col];

                if (bubble && !bubble.checked) {
                    isEmpty = false;
                    break;
                }
            }

            if (isEmpty) emptyColumns.add(col);
        }

        if (!emptyColumns.size) return;

        // Сдвигаем колонки влево на количество пустых колонок слева от них
        for (let col = 0; col < columns; col++) {
            let shiftLeft = 0;

            for (let c = 0; c < col; c++) {
                if (emptyColumns.has(c)) shiftLeft++;
            }

            if (shiftLeft === 0) continue;

            for (let row = 0; row < rows; row++) {
                const bubble = bubbles[row * columns + col];

                if (bubble && !bubble?.checked) {
                    const targetX = (col - shiftLeft) * cellSize + radius;

                    this.state.setTarget('left', bubble, targetX);

                    if (!collapseBubbles.includes(bubble)) {
                        collapseBubbles.push(bubble);
                    }
                }
            }
        }
    }
}
