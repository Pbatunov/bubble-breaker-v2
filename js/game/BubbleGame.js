import {CONFIG, COLORS} from '../config.js';
import {GameState} from '../state/GameState.js';
import {Grid} from '../grid/Grid.js';
import {BubbleFactory} from './BubbleFactory.js';
import {GroupFinder} from './GroupFinder.js';
import {CollapseCalculator} from './CollapseCalculator.js';
import {MovementPlanner} from './MovementPlanner.js';
import {AnimationController} from './AnimationController.js';
import {Renderer} from './Renderer.js';
import {AudioManager} from '../audio/AudioManager.js';
import {ScoreManager} from '../utils/ScoreManager.js';
import {EventBus} from './EventBus.js';
import {GameOver} from './GameOver.js';
import {getLevelTarget, getPointsPerBubble} from './LevelRules.js';

const POP_INTERVAL_MS = 60; // пауза между лопающимися оставшимися пузырями в конце уровня

/**
 * Главный контроллер игры: создаёт подсистемы, обрабатывает клики, ведёт уровни
 * и запускает игровой цикл. Все подсистемы пересоздаются при каждом старте уровня в reset().
 */
export class BubbleGame {
    /**
     * @param {HTMLCanvasElement} canvas - игровой канвас (обязателен)
     * @param {Object} [options]
     * @param {{rows: number, columns: number, speed: number}} [options.config=CONFIG] - настройки поля
     * @param {Object<string, string>} [options.colors=COLORS] - палитра пузырей
     * @throws {Error} если canvas не передан
     */
    constructor(canvas, {config = CONFIG, colors = COLORS} = {}) {
        if (!canvas) {
            throw new Error('BubbleGame: canvas не найден.');
        }

        this.scoreElement = document.getElementById('score');

        this.canvas = canvas;
        this.config = config;
        this.colors = colors;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        //this.reset();
        this.lastTime = performance.now();
        this.animationFrame = null;

        // Прогресс между уровнями: сохраняется при переходе, сбрасывается при проигрыше
        this.level = 1;
        this.carryOver = 0;
        // Следующий уровень применяется только после закрытия попапа (в init)
        this.pendingLevel = null;
        this.pendingCarry = 0;
        this.popTimer = null;

        this.gameOver = new GameOver({
            canvas: this.canvas,
            destroy: this.destroy,
            gameContext: this,
            reInit: this.init,
        });
    }

    /**
     * Создаёт все подсистемы уровня заново. Счёт стартует с переноса предыдущего уровня.
     */
    reset() {
        this.events = new EventBus();
        this.state = new GameState();

        this.grid = new Grid({canvas: this.canvas, state: this.state, config: this.config});

        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager(this.carryOver, getPointsPerBubble(this.level));
        this.targetReached = false;
        this.levelFinished = false;

        this.factory = new BubbleFactory({
            grid: this.grid, state: this.state, config: this.config, colors: this.colors, audioManager: this.audioManager,
        });

        this.groups = new GroupFinder({state: this.state, grid: this.grid});

        this.collapse = new CollapseCalculator({
            state: this.state, grid: this.grid, config: this.config
        });

        this.movement = new MovementPlanner({
            state: this.state, grid: this.grid,
        });

        this.animation = new AnimationController({
            state: this.state,
            movementPlanner: this.movement,
            speed: this.config.speed,
        });

        this.renderer = new Renderer({
            canvas: this.canvas, state: this.state, animation: this.animation,
            onAnimationStop: () => this.finishAnimation(),
        });

        this.handleClick = this.handleClick.bind(this);
        this.loop = this.loop.bind(this);

        // Подписываемся на события, которые хотим обрабатывать в игре
        this._subscriptions = [];
    }

    /**
     * Подписывает канвас на клики и внутренние события игры.
     */
    setupEventHandlers() {
        // Обработка клика по канвасу (ввод)
        this.canvas.addEventListener('mousedown', () => this.initAudio(), {once: true});
        this.canvas.addEventListener('click', this.handleClick);

        // Внутренние события игры
        const stopAnimUnsub = this.events.on('stopAnimation', () => {
            this.grid.recalculateAll(this.state.bubbles);
        });

        this._subscriptions.push(stopAnimUnsub);

        const gameOverUnsub = this.events.on('gameOver', (result) => {
            this.gameOver.start(result);
        });

        this._subscriptions.push(gameOverUnsub);
    }

    /**
     * Обновляет текст в HUD: уровень, отображаемый счёт и цель.
     */
    updateScoreDisplay() {
        if (this.scoreElement) {
            const target = getLevelTarget(this.level);
            this.scoreElement.textContent =
                `Уровень ${this.level} | Счёт: ${this.scoreManager.getCurrentDisplayScore()} / ${target}`;
        }
    }

    /**
     * Начисляет очки за лопнувшую группу, показывает баннер при достижении цели и мигает счётом.
     * @param {number} count - количество пузырей в группе
     * @returns {number} начисленные очки
     */
    awardPointsForGroup(count) {
        // Очки сразу уходят в целевой счёт; отображаемый счёт догонит их в loop()
        const points = this.scoreManager.addGroup(count);

        if (!this.targetReached && this.scoreManager.getScore() >= getLevelTarget(this.level)) {
            this.targetReached = true;
            this.showLevelBanner('Цель достигнута');
        }

        // Мигание
        if (this.scoreElement) {
            this.scoreElement.classList.add('highlight');
            setTimeout(() => this.scoreElement.classList.remove('highlight'), 400);
        }

        return points;
    }

    /**
     * Запускает уровень: применяет ожидающий переход на следующий уровень,
     * создаёт поле и запускает игровой цикл.
     */
    init() {
        // Останавливаем цикл, запущенный до перезапуска, чтобы не было нескольких параллельных loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.applyPendingLevel();
        this.reset();
        this.factory.create();
        this.grid.saveCoordinates();
        this.setupEventHandlers();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    /**
     * Переводит игру на уровень и перенос очков, подготовленные в finishLevel().
     * Ничего не делает, если перехода нет.
     */
    applyPendingLevel() {
        if (this.pendingLevel === null) return;

        this.level = this.pendingLevel;
        this.carryOver = this.pendingCarry;
        this.pendingLevel = null;
    }

    /**
     * Создаёт AudioContext и загружает звук лопания. Вызывается при первом нажатии мыши.
     * @returns {Promise<void>}
     */
    async initAudio() {
        this.audioManager.init(); // Создает AudioContext

        try {
            await this.audioManager.loadSound('pop', 'assets/audio/pop.mp3');
        } catch (e) {
            console.error('Ошибка загрузки звука:', e);
        }
    }

    /**
     * Останавливает цикл, таймеры и снимает обработчики событий.
     */
    destroy() {
        this.canvas.removeEventListener('click', this.handleClick);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.popTimer) {
            clearInterval(this.popTimer);
            this.popTimer = null;
        }

        // Отписываемся от внутренних событий
        this._subscriptions.forEach((unsub) => unsub());
        this._subscriptions = [];
    }

    /**
     * Обработчик клика: лопает группу под курсором, пересчитывает падение и начисляет очки.
     * @param {MouseEvent} event
     */
    handleClick(event) {
        if (this.state.isAnimating) return;

        const selected = this.groups.selectAt(event.offsetX, event.offsetY);
        if (!selected) return;

        const {columns, rows} = this.config;

        const newBubbles = new Array(rows * columns).fill(null);

        this.state.bubbles.forEach((bubble) => {
            if (bubble && !bubble.isDead) {
                newBubbles[bubble.index] = bubble;
            }
        });

        this.state.bubbles = newBubbles;

        this.collapse.reset();

        const checked = this.state.bubbles.filter((b) => b && b.checked);

        const {fallingBubbles, collapseBubbles} = this.collapse.calculate(checked);

        this.playCollapseSounds(checked);

        const points = this.awardPointsForGroup(checked.length);

        this.showFloatingPoints(event.offsetX, event.offsetY, points);
    }

    /**
     * Показывает крупную надпись по центру экрана на 1.5 секунды.
     * @param {string} text
     */
    showLevelBanner(text) {
        const el = document.createElement('div');
        el.className = 'floating-points';
        el.textContent = text;
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.top = '40%';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.color = '#FFF';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '28px';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);

        setTimeout(() => el.remove(), 1500);
    }

    /**
     * Проигрывает звуки лопания с задержкой между пузырями.
     * @param {Array<Bubble>} bubblesToPop
     */
    playCollapseSounds(bubblesToPop) {
        const delay = 50; // Задержка между звуками (мс)

        bubblesToPop.forEach((bubble, index) => {
            setTimeout(() => {
                // Проверяем, не удалили ли уже пузырь (на случай рассинхрона)
                if (bubble && bubble.shouldPlaySound) {
                    bubble.playSound();
                }
            }, index * delay);
        });
    }

    /**
     * Показывает всплывающее «+N» над местом клика, которое плавно гаснет.
     * @param {number} x - координата X относительно канваса
     * @param {number} y - координата Y относительно канваса
     * @param {number} points - число для показа
     */
    showFloatingPoints(x, y, points) {
        const el = document.createElement('div');
        el.className = 'floating-points';
        el.textContent = '+' + points;
        el.style.position = 'absolute';
        // Переводим координаты канваса в экранные (если canvas не 1:1)
        const rect = this.canvas.getBoundingClientRect();
        el.style.left = (rect.left + x - 20) + 'px';
        el.style.top = (rect.top + y - 20) + 'px';
        el.style.color = '#FFF';
        el.style.fontWeight = 'bold';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);

        setTimeout(() => {
            el.style.transition = 'opacity 1.5s, transform 1.5s';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-30px)';
            setTimeout(() => el.remove(), 1500);
        }, 50);
    }

    /**
     * Вызывается после окончания анимации: убирает лопнувшие пузыри, сбрасывает цели
     * и проверяет конец уровня.
     */
    finishAnimation() {
        const {bubbles} = this.state;
        const {columns, rows} = this.config;

        this.grid.resortBubbles()

        // Удаляем чекнутые пузыри — НЕ переиспользуем их
        const newBubbles = new Array(rows * columns).fill(null);

        bubbles.forEach((bubble) => {
            if (bubble && !bubble.checked) {
                newBubbles[bubble.index] = bubble;
            }
        });

        this.state.bubbles = newBubbles;
        this.state.resetTargets();
        this.state.resetMovement();
        this.collapse.calculate([]);
        this.checkGameOver();

        this.events.emit('stopAnimation');
    }

    /**
     * Уровень заканчивается, когда нет ни групп, ни движения, ни взрывов.
     */
    checkGameOver() {
        if (this.levelFinished) return;

        if (!this.groups.hasGroups() && !this.state.hasTargets() && !this.state.exploding.size) {
            this.finishLevel();
        }
    }

    /**
     * Конец уровня: GameOver считает итог (бонус, победа/поражение, перенос),
     * здесь только сохраняем следующий уровень и показываем попап.
     */
    finishLevel() {
        this.levelFinished = true;

        const remaining = this.state.bubbles.filter((b) => b && !b.isDead).length;

        const result = this.gameOver.resolve({
            level: this.level,
            remaining,
            scoreManager: this.scoreManager,
        });

        // Текущий уровень и HUD не меняем до закрытия попапа
        this.pendingLevel = result.nextLevel;
        this.pendingCarry = result.carry;

        this.events.emit('gameOver', result);

        this.popRemainingBubbles();
    }

    /**
     * Лопает оставшиеся пузыри по одному, пока показан попап.
     * Бонус уже начислен в finishLevel — здесь только визуальный эффект.
     * Не регистрируем взрыв в state.exploding, чтобы не запускать finishAnimation.
     */
    popRemainingBubbles() {
        const queue = this.state.bubbles.filter((b) => b && !b.isDead && !b.isExploding);

        this.popTimer = setInterval(() => {
            const bubble = queue.shift();

            if (!bubble) {
                clearInterval(this.popTimer);
                this.popTimer = null;
                return;
            }

            bubble.startExplosion();
            bubble.playSound();
        }, POP_INTERVAL_MS);
    }

    /**
     * Игровой цикл (requestAnimationFrame): обновляет счёт, анимацию и отрисовку.
     * @param {number} currentTime - время кадра в мс (из requestAnimationFrame)
     */
    loop(currentTime) {
        // 1. Считаем время, прошедшее с прошлого кадра (deltaTime)
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 2. Обновляем счёт (если есть разрыв, он начнёт плавно расти)
        // tick вернёт true, пока счёт не догнал реальный
        this.scoreManager.tick(deltaTime);
        this.updateScoreDisplay();

        // 3. Отрисовка игры
        this.renderer.render();
        this.animationFrame = requestAnimationFrame((t) => this.loop(t));
    }
}
