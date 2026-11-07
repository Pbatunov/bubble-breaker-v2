/**
 * Геометрия игрового поля: переводит индексы и строки/колонки пузырей в координаты
 * канваса и даёт доступ к соседям по сетке.
 */
export class Grid {
    /**
     * @param {Object} params
     * @param {HTMLCanvasElement} params.canvas - канвас, размер которого определяет сетку
     * @param {GameState} params.state - состояние игры, из которого берутся пузыри
     * @param {{rows: number, columns: number}} params.config - размеры поля
     */
    constructor({ canvas, state, config }) {
        this.canvas = canvas;
        this.state = state;
        this.config = config;

        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.cellSize = this.width / config.columns;
        this.radius = this.cellSize / 2;
    }

    /**
     * Координаты центра ячейки сетки.
     * @param {number} row - строка, начиная с 0
     * @param {number} column - колонка, начиная с 0
     * @returns {{x: number, y: number}}
     */
    getPosition(row, column) {
        return {
            x: column * this.cellSize + this.radius,
            y: row * this.cellSize + this.radius,
        };
    }

    /**
     * Пузырь по индексу в массиве state.bubbles.
     * @param {number} index
     * @returns {Bubble|null|undefined}
     */
    get(index) {
        return this.state.bubbles[index];
    }

    /**
     * Пузырь над ячейкой с индексом index (может быть вне поля).
     * @param {number} index
     * @returns {Bubble|null|undefined}
     */
    getTop(index) {
        return this.get(index - this.config.columns);
    }

    /**
     * Пузырь под ячейкой с индексом index (может быть вне поля).
     * @param {number} index
     * @returns {Bubble|null|undefined}
     */
    getBottom(index) {
        return this.get(index + this.config.columns);
    }

    /**
     * Пузырь слева от ячейки index, если он в той же строке.
     * @param {number} index
     * @returns {Bubble|undefined}
     */
    getLeft(index) {
        const bubble = this.get(index);
        const candidate = this.get(index - 1);

        return candidate && candidate.y === bubble?.y
            ? candidate
            : undefined;
    }

    /**
     * Пузырь справа от ячейки index, если он в той же строке.
     * @param {number} index
     * @returns {Bubble|undefined}
     */
    getRight(index) {
        const bubble = this.get(index);
        const candidate = this.get(index + 1);

        return candidate && candidate.y === bubble?.y
            ? candidate
            : undefined;
    }

    /**
     * Сохраняет исходные координаты всех пузырей в state.coordsGrid.
     */
    saveCoordinates() {
        this.state.coordsGrid = this.state.bubbles.map((bubble) => ({
            x: bubble.x,
            y: bubble.y,
            row: bubble.row,
            column: bubble.column,
            index: bubble.index,
        }));
    }

    /**
     * Пересчитывает строку, колонку и индекс пузыря по его текущим координатам.
     * @param {Bubble|null|undefined} bubble
     */
    recalculate(bubble) {
        bubble?.updateGridPosition(this.cellSize);
    }

    /**
     * Пересчитывает сетку для всех переданных пузырей.
     * @param {Array<Bubble|null>} bubbles
     */
    recalculateAll(bubbles) {
        bubbles.forEach((bubble) => {
            this.recalculate(bubble);
        })
    }

    /**
     * После лопания пустые места заполняются пузырями, которые ещё не на своём месте:
     * им назначаются свободные ячейки по порядку индексов.
     */
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
