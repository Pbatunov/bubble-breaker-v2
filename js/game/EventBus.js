export class EventBus {
    constructor() {
        this.listeners = new Map(); // Map<eventName, Set<callback>>
    }

    // Подписаться на событие
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        // Возвращаем функцию для отписки (удобно в destroy)
        return () => this.off(eventName, callback);
    }

    // Отписаться от события
    off(eventName, callback) {
        const set = this.listeners.get(eventName);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(eventName);
            }
        }
    }

    // Вызвать событие (синхронно)
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
