/**
 * Счёт уровня: начисляет очки за группы и бонусы и плавно показывает их на экране.
 */
export class ScoreManager {
    /**
     * @param {number} startScore - стартовый счёт (остаток с предыдущего уровня)
     * @param {number} scoresForOneBubble - очки за один пузырь в группе (зависит от уровня)
     */
    constructor(startScore = 0, scoresForOneBubble = 15) {
        this.score = startScore;
        this.displayScore = startScore;
        this.speed = 300;
        this.scoresForOneBubble = scoresForOneBubble;
    }

    /**
     * Добавляет бонус в конце уровня сразу в целевой счёт.
     * @param {number} points
     */
    addBonus(points) {
        this.score += points;
        return points;
    }

    /**
     * Начисляет очки за одну группу пузырей, которую игрок лопнул кликом
     * @param {number} count - количество пузырей в группе (минимум 2)
     */
    addGroup(count) {
        if (count < 2) return 0;

        // Множитель за размер группы
        let multiplier = 1;
        if (count >= 4 && count < 8) multiplier = 2;

        else if (count >= 8 && count < 10) multiplier = 3;

        else if (count >=10 && count < 12) multiplier = 4;

        else if (count >= 12) multiplier = 5;

        const points = count * this.scoresForOneBubble * multiplier;
        this.score += points;
        return points;
    }

    /**
     * Реальный счёт (без анимации).
     * @returns {number}
     */
    getScore() {
        return this.score;
    }

    /**
     * Один кадр анимации.
     * @param {number} deltaTime - время с прошлого кадра в мс (обычно ~16.6 при 60 FPS)
     * @returns {boolean} true, если анимация ещё не завершена
     */
    tick(deltaTime) {
        const remaining = this.score - this.displayScore;

        if (remaining <= 0) {
            this.displayScore = this.score; // На всякий случай выравниваем
            return false;
        }

        // Вычисляем, сколько очков нужно добавить за этот кадр,
        // чтобы получить примерно this.speed очков в секунду.
        const step = (this.speed / 1000) * deltaTime;

        this.displayScore += step;

        // Не позволяем перескочить реальный счёт
        if (this.displayScore >= this.score) {
            this.displayScore = this.score;
            return false; // Анимация закончена
        }

        return true; // Анимация продолжается
    }

    /**
     * Отображаемый счёт, который догоняет реальный (целое число для вывода на экран).
     * @returns {number}
     */
    getCurrentDisplayScore() {
        return Math.floor(this.displayScore);
    }
}
