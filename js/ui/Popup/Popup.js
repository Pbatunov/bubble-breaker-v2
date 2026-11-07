export class Popup {
    constructor({container = document.body, textContent, buttonText, onShow, onClose}) {
        this.container = container;
        this.textContent = textContent;
        this.buttonText = buttonText;
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
                    <div class="popup__content">
                        Уровень пройден!
                    </div>
                    <button class="popup__button js-popup-button">Сначала!</button>
                </div>
            `

        this.popupElement.insertAdjacentHTML('beforeend', html);
        this.container.append(this.popupElement);

        if (this.onShow && typeof this.onShow === 'function') {
            this.onShow();
        }

        this.popupButton = this.popupElement.querySelector('.js-popup-button');

        this.popupButton.addEventListener('click', (e) => {
            if (this.onClose && typeof this.onClose === 'function') {
                this.onClose();
            }
        })
    }

    destroy() {
        if (this.popupElement) {
            this.popupElement.remove();

            this.popupElement = null;
        }
    }
}
