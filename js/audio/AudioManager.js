/**
 * Загрузка и воспроизведение звуков через Web Audio API.
 */
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map(); // { id: AudioBuffer }
        this.masterVolume = 1.0;
        this.isInitialized = false;
    }

    /**
     * Инициализация AudioContext (обязательно после клика пользователя).
     */
    init() {
        if (this.isInitialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = true;
    }

    /**
     * Загрузка звука по пути. Без вызова init() ничего не делает.
     * @param {string} id - имя, под которым звук будет доступен в play()
     * @param {string} path - путь к аудиофайлу
     * @returns {Promise<void>}
     * @throws {Error} если файл не удалось загрузить
     */
    async loadSound(id, path) {
        if (!this.audioContext) {
            console.warn('AudioManager не инициализирован. Вызовите init() после клика.');
            return;
        }

        const response = await fetch(path);
        if (!response.ok) throw new Error(`Не удалось загрузить звук: ${path}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds.set(id, audioBuffer);
    }

    /**
     * Воспроизведение звука. Тихо пропускается, если звук не загружен.
     * @param {string} id - имя звука, переданное в loadSound()
     * @param {number} [volume=1.0] - громкость от 0 до 1 (с учётом masterVolume)
     */
    play(id, volume = 1.0) {
        if (!this.isInitialized || !this.sounds.has(id)) return;

        const actualVolume = Math.min(1.0, volume * this.masterVolume);
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds.get(id);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = actualVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start();
    }

    /**
     * Общая громкость для всех звуков.
     * @param {number} volume - значение от 0 до 1 (выходит за границы — обрезается)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}
