/**
 * Вычисляет, куда должны упасть или сдвинуться пузыри после лопания группы.
 * Сначала считается вертикальное падение, и только если оно не нужно,
 * — горизонтальный сдвиг колонок влево.
 */
export class CollapseCalculator {
    /**
     * @param {Object} params
     * @param {GameState} params.state - состояние игры (сюда пишутся цели движения)
     * @param {Grid} params.grid - геометрия поля
     * @param {{rows: number, columns: number}} params.config - размеры поля
     */
    constructor({ state, grid, config }) {
        this.state = state;
        this.grid = grid;
        this.config = config;
    }

    /**
     * Очищает все цели движения перед новым расчётом.
     */
    reset() {
        this.state.resetTargets();
    }

    /**
     * Рассчитывает падение и сдвиг пузырей после лопания.
     * @param {Array<Bubble>} checkedBubbles - лопнувшие пузыри
     * @returns {{fallingBubbles: Array<Bubble>, collapseBubbles: Array<Bubble>}}
     *          падающие по вертикали и сдвигающиеся по горизонтали пузыри
     */
    calculate(checkedBubbles) {
        const fallingBubbles = [];
        const collapseBubbles = [];

        this.calculateVerticalTargets(checkedBubbles, fallingBubbles);

        if (!fallingBubbles.length) {
            this.calculateHorizontalTargets(collapseBubbles);
        }

        return { fallingBubbles, collapseBubbles };
    }

    /**
     * Записывает цели падения для пузырей, под которыми есть лопнувшие.
     * @param {Array<Bubble>} checkedBubbles - лопнувшие пузыри
     * @param {Array<Bubble>} fallingBubbles - сюда добавляются падающие пузыри
     */
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

    /**
     * Записывает цели сдвига влево для колонок правее полностью пустых колонок.
     * @param {Array<Bubble>} collapseBubbles - сюда добавляются сдвигаемые пузыри
     */
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
