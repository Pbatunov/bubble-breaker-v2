/**
 * Находит группы одноцветных соседних пузырей и помечает их как лопающиеся.
 * Соседство считается только по сторонам (сверху, справа, снизу, слева).
 */
export class GroupFinder {
    /**
     * @param {Object} params
     * @param {GameState} params.state - состояние игры
     * @param {Grid} params.grid - геометрия поля для поиска соседей
     */
    constructor({state, grid}) {
        this.state = state;
        this.grid = grid;
    }

    /**
     * Соседи по сторонам того же типа (цвета), что и bubble.
     * @param {number} index - индекс пузыря в сетке
     * @param {Bubble} bubble - пузырь, для которого ищем соседей
     * @param {{skipChecked?: boolean}} [options] - пропускать ли уже помеченные пузыри (по умолчанию да)
     * @returns {Array<Bubble>}
     */
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

    /**
     * Рекурсивно помечает всю группу, начиная с пузыря по индексу.
     * В режиме readOnly ничего не меняет, а только проверяет, есть ли у пузыря сосед того же цвета.
     * @param {number} index - индекс стартового пузыря
     * @param {{readOnly?: boolean}} [options]
     * @returns {boolean} true, если пузырь входит в группу (или, при readOnly, имеет соседа того же цвета)
     */
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

    /**
     * Есть ли на поле хотя бы одна группа, которую можно лопнуть.
     * @returns {boolean}
     */
    hasGroups() {
        return this.state.bubbles
            .filter((bubble) => bubble && !bubble.checked)
            .some((bubble) => this.findAndMark(bubble.index, {readOnly: true}));
    }

    /**
     * Находит пузырь под координатами клика и помечает его группу.
     * @param {number} x - координата X клика относительно канваса
     * @param {number} y - координата Y клика относительно канваса
     * @returns {boolean} true, если группа найдена и помечена
     */
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
