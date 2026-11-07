import {Popup} from "../ui/Popup/Popup.js";

export class GameOver {
    constructor({state, grid, destroy, gameContext, reInit}) {
        this.state = state;
        this.grid = grid;
        this.destroy = destroy;
        this.gameContext = gameContext;
        this.reInit = reInit
    }

    start() {
        const popup = new Popup({
            onShow: () => {},

            onClose: () => {
                popup.destroy();

                if (this.destroy) {
                    this.destroy.call(this.gameContext);
                }

                this.reInit.call(this.gameContext);
            }
        })

        popup.show();
    }
}
