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

export class BubbleGame {
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

        this.gameOver = new GameOver({
            state: this.state,
            grid: this.grid,
            scoreElement: this.scoreElement,
            popup: this.popup,
            destroy: this.destroy,
            gameContext: this,
            reInit: this.init,
        });
    }

    reset() {
        this.events = new EventBus();
        this.state = new GameState();

        this.grid = new Grid({canvas: this.canvas, state: this.state, config: this.config});

        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager();

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

    setupEventHandlers() {
        // Обработка клика по канвасу (ввод)
        this.canvas.addEventListener('mousedown', () => this.initAudio(), {once: true});
        this.canvas.addEventListener('click', this.handleClick);

        // Внутренние события игры
        const stopAnimUnsub = this.events.on('stopAnimation', () => {
            this.grid.recalculateAll(this.state.bubbles);
        });

        this._subscriptions.push(stopAnimUnsub);

        const gameOverUnsub = this.events.on('gameOver', () => {
            this.gameOver.start()
        });

        this._subscriptions.push(gameOverUnsub);
    }

    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Счёт: ${this.scoreManager.getCurrentDisplayScore()}`;
        }
    }

    awardPointsForGroup(count) {
        // Очки сразу уходят в целевой счёт; отображаемый счёт догонит их в loop()
        const points = this.scoreManager.addGroup(count);

        // Мигание
        if (this.scoreElement) {
            this.scoreElement.classList.add('highlight');
            setTimeout(() => this.scoreElement.classList.remove('highlight'), 400);
        }

        return points;
    }

    init() {
        // Останавливаем цикл, запущенный до перезапуска, чтобы не было нескольких параллельных loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.reset();
        this.factory.create();
        this.grid.saveCoordinates();
        this.setupEventHandlers();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    async initAudio() {
        this.audioManager.init(); // Создает AudioContext

        try {
            await this.audioManager.loadSound('pop', 'assets/audio/pop.mp3');
        } catch (e) {
            console.error('Ошибка загрузки звука:', e);
        }
    }

    destroy() {
        this.canvas.removeEventListener('click', this.handleClick);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Отписываемся от внутренних событий
        this._subscriptions.forEach((unsub) => unsub());
        this._subscriptions = [];
    }

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

        const remaining = this.state.bubbles.filter((b) => b).length;
        const isGameOver = remaining < 2 || !this.groups.hasGroups();

        this.playCollapseSounds(checked);

        const points = this.awardPointsForGroup(checked.length);

        this.showFloatingPoints(event.offsetX, event.offsetY, points);
    }

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

    checkGameOver() {
        if (!this.groups.hasGroups() && !this.state.hasTargets() && !this.state.exploding.size) {
            this.dispatchGameOver();
        }
    }

    dispatchGameOver() {
        this.events.emit('gameOver');
    }

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
