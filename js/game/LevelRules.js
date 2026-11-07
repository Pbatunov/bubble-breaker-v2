// Правила прохождения уровней.

export const FIRST_LEVEL_TARGET = 1000;
export const TARGET_STEP = 500;

/**
 * Цель уровня: на первом 1000, далее +500 за каждый уровень.
 * @param {number} level - номер уровня, начиная с 1
 */
export function getLevelTarget(level) {
    return FIRST_LEVEL_TARGET + TARGET_STEP * (level - 1);
}

/**
 * Бонус за оставшиеся в конце уровня пузыри.
 * Меньше 5 пузырей — по 100 очков за каждый, меньше 10 — по 50, иначе бонуса нет.
 * @param {number} remaining - количество оставшихся пузырей
 */
export function getLeftoverBonus(remaining) {
    if (remaining < 5) return remaining * 300;
    if (remaining < 10) return remaining * 50;
    return 0;
}
