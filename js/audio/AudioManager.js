export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map(); // { id: AudioBuffer }
        this.masterVolume = 1.0;
        this.isInitialized = false;
    }

    // Инициализация AudioContext (обязательно после клика пользователя)
    init() {
        if (this.isInitialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = true;
    }

    // Загрузка звука по пути
    async loadSound(id, path) {
        if (!this.audioContext) {
            console.warn('AudioManager не инициализирован. Вызовите init() после клика.');
            return;
        }

        const response = await fetch(path);
        if (!response.ok) throw new Error(`Не удалось загрузить звук: \${path}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds.set(id, audioBuffer);
    }

    // Воспроизведение звука
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

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}
