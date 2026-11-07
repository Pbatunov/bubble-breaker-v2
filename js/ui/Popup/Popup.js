export class Popup {
    /**
     * Модальное окно поверх игры с текстом и кнопкой.
     * @param {Object} params
     * @param {HTMLElement} [params.container=document.body] - элемент, в который вставляется попап
     * @param {string|string[]} [params.textContent] - строка или массив строк (каждая — отдельный абзац)
     * @param {string} [params.buttonText='Сначала!'] - текст кнопки
     * @param {HTMLElement} [params.anchor] - элемент, относительно которого попап центрируется и подгоняется по размеру
     * @param {() => void} [params.onShow] - вызывается после показа
     * @param {() => void} [params.onClose] - вызывается по нажатию кнопки
     */
    constructor({container = document.body, textContent, buttonText, anchor, onShow, onClose}) {
        this.container = container;
        this.textContent = textContent;
        this.buttonText = buttonText;
        this.anchor = anchor;
        this.popupElement = document.createElement("div")
        this.popupButton = null
        this.onShow = onShow;
        this.onClose = onClose;
    }

    show() {
        if (!this.container) {
            return ;
        }

        this.popupElement.classList.add('popup');

        const html = `
                <div class="popup__inner">
                    <div class="popup__content"></div>
                    <button class="popup__button js-popup-button"></button>
                </div>
            `

        this.popupElement.insertAdjacentHTML('beforeend', html);
        this.container.append(this.popupElement);

        // Строки вставляются через textContent, а не через HTML
        const lines = Array.isArray(this.textContent)
            ? this.textContent
            : [this.textContent ?? 'Уровень пройден!'];

        const content = this.popupElement.querySelector('.popup__content');
        lines.forEach((line) => {
            const p = document.createElement('p');
            p.textContent = line;
            content.append(p);
        });

        if (this.anchor) {
            this.fitToAnchor();
        }

        if (this.onShow && typeof this.onShow === 'function') {
            this.onShow();
        }

        this.popupButton = this.popupElement.querySelector('.js-popup-button');
        this.popupButton.textContent = this.buttonText ?? 'Сначала!';
        // Кнопка должна читаться при любом размере шрифта попапа
        this.popupButton.style.fontSize = '0.7em';

        this.popupButton.addEventListener('click', (e) => {
            if (this.onClose && typeof this.onClose === 'function') {
                this.onClose();
            }
        })
    }

    /**
     * Ширина 90% и высота не больше 90% от anchor, центр попапа — в центре anchor.
     * Если текст не помещается по высоте, шрифт уменьшается.
     */
    fitToAnchor() {
        const rect = this.anchor.getBoundingClientRect();
        const el = this.popupElement;

        el.style.boxSizing = 'border-box';
        el.style.width = `${rect.width * 0.9}px`;
        el.style.maxHeight = `${rect.height * 0.9}px`;
        el.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
        el.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;

        const minFontSize = 12;
        let fontSize = rect.width * 0.04;
        el.style.fontSize = `${fontSize}px`;

        while (el.scrollHeight > el.clientHeight && fontSize > minFontSize) {
            fontSize -= 1;
            el.style.fontSize = `${fontSize}px`;
        }
    }

    destroy() {
        if (this.popupElement) {
            this.popupElement.remove();

            this.popupElement = null;
        }
    }
}
