import { Bubble } from '../models/Bubble.js';

const types =
    [
        [3,2,4,4],
        [3,2,4,4],
        [3,2,4,4],
        [1,3,4,4],
    ]

/**
 * Создаёт пузыри и заполняет ими всё поле в начале уровня.
 */
export class BubbleFactory {
    /**
     * @param {Object} params
     * @param {Grid} params.grid - геометрия поля (координаты ячеек)
     * @param {GameState} params.state - состояние игры, в которое добавляются пузыри
     * @param {{rows: number, columns: number}} params.config - размеры поля
     * @param {Object<string, string>} params.colors - палитра: имя цвета -> CSS-цвет
     * @param {AudioManager} params.audioManager - менеджер звука для пузырей
     */
    constructor({ grid, state, config, colors, audioManager }) {
        this.grid = grid;
        this.state = state;
        this.config = config;
        this.colorsNames = Object.keys(colors);
        this.colorsValues = Object.values(colors);
        this.ctx = grid.canvas.getContext('2d');
        this.audioManager = audioManager;
    }

    /**
     * Создаёт пузыри со случайными цветами и добавляет их в state.bubbles.
     */
    create() {
        const { rows, columns } = this.config;

        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
                const type = Math.floor(Math.random() * this.colorsValues.length);
                //const type = types[row][column];
                const color = this.colorsNames[type];
                const position = this.grid.getPosition(row, column);
                const imagePath = `assets/images/bubbles/${color}.svg`;

                this.state.bubbles.push(new Bubble({
                    ...position,
                    radius: this.grid.radius,
                    fillColor: this.colorsValues[type],
                    type,
                    index: row * columns + column,
                    row,
                    column,
                    imagePath,
                    ctx: this.ctx,
                    config: this.config,
                    audioManager: this.audioManager,
                }));
            }
        }
    }
}
