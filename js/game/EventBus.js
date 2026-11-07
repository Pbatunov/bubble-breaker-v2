/**
 * Простая шина событий: подписка, отписка и синхронная рассылка.
 */
export class EventBus {
    constructor() {
        this.listeners = new Map(); // Map<eventName, Set<callback>>
    }

    /**
     * Подписаться на событие.
     * @param {string} eventName
     * @param {(payload: any) => void} callback
     * @returns {() => void} функция для отписки
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        // Возвращаем функцию для отписки (удобно в destroy)
        return () => this.off(eventName, callback);
    }

    /**
     * Отписаться от события.
     * @param {string} eventName
     * @param {(payload: any) => void} callback - та же функция, что передавалась в on()
     */
    off(eventName, callback) {
        const set = this.listeners.get(eventName);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    /**
     * Вызвать событие синхронно. Ошибка в одном обработчике не мешает остальным.
     * @param {string} eventName
     * @param {any} [payload=null] - данные, передаваемые обработчикам
     */
    emit(eventName, payload = null) {
        const callbacks = this.listeners.get(eventName);
        if (!callbacks) return;

        callbacks.forEach((cb) => {
            try {
                cb(payload);
            } catch (e) {
                console.error(`Ошибка в обработчике события "${eventName}":`, e);
            }
        });
    }
}
