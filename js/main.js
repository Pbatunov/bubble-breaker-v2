import { BubbleGame } from './game/BubbleGame.js';

const canvas = document.querySelector('canvas');
const game = new BubbleGame(canvas);

game.init();

// game.destroy();
