import {Popup} from "../ui/Popup/Popup.js";
import {getLevelTarget, getLeftoverBonus} from "./LevelRules.js";

/**
 * Конец уровня: подсчёт итога, перенос очков и попап с результатом.
 */
export class GameOver {
    /**
     * @param {Object} params
     * @param {HTMLCanvasElement} params.canvas - канвас, относительно которого показывается попап
     * @param {() => void} [params.destroy] - вызывается перед перезапуском (очистка игры)
     * @param {*} params.gameContext - значение this для destroy и reInit
     * @param {() => void} params.reInit - перезапуск игры после закрытия попапа
     */
    constructor({canvas, destroy, gameContext, reInit}) {
        this.canvas = canvas;
        this.destroy = destroy;
        this.gameContext = gameContext;
        this.reInit = reInit;
    }

    /**
     * Итог уровня: начисляет бонус за оставшиеся пузыри, решает победу/поражение
     * и считает перенос очков. Вызывается один раз в конце уровня.
     * @param {{level: number, remaining: number, scoreManager: ScoreManager}} params
     * @returns {{level, won, total, target, remaining, bonus, carry, nextLevel}}
     */
    resolve({level, remaining, scoreManager}) {
        const bonus = scoreManager.addBonus(getLeftoverBonus(remaining));

        const total = scoreManager.getScore();
        const target = getLevelTarget(level);
        const won = total >= target;

        return {
            level,
            won,
            total,
            target,
            remaining,
            bonus,
            carry: won ? total - target : 0,
            nextLevel: won ? level + 1 : 1,
        };
    }

    /**
     * Показывает попап с итогом уровня. По закрытию перезапускает игру.
     * @param {{level, won, total, target, remaining, bonus, carry}} result - итог уровня из resolve()
     */
    start(result) {
        const popup = new Popup({
            textContent: this.buildText(result),
            buttonText: result.won ? 'Далее' : 'Сначала!',
            // Попап подгоняется под канвас: 90% по ширине и высоте
            anchor: this.canvas,

            onClose: () => {
                popup.destroy();

                if (this.destroy) {
                    this.destroy.call(this.gameContext);
                }

                this.reInit.call(this.gameContext);
            }
        });

        popup.show();
    }

    /**
     * Строки текста для попапа.
     * @param {{level, won, total, target, remaining, bonus, carry}} result - итог уровня из resolve()
     * @returns {string[]}
     */
    buildText(result) {
        const lines = [];

        if (result.won) {
            lines.push(`Уровень ${result.level} пройден!`);
            lines.push('Цель достигнута');
        } else {
            lines.push('Цель не достигнута');
        }

        lines.push(`Счёт: ${result.total} из ${result.target}`);

        if (result.remaining > 0) {
            lines.push(`Бонус за ${result.remaining} пузырей: +${result.bonus}`);
        }

        if (result.won) {
            if (result.carry > 0) {
                lines.push(`Перенос на следующий уровень: ${result.carry}`);
            }
        } else {
            lines.push('Игра начнётся заново с первого уровня');
        }

        return lines;
    }
}
