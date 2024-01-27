

import { GameController } from "./game_controller";
import { Vector } from "./types";
import btnClickSound from './sounds/btn_click.mp3';

const root = document.getElementById("root");
const startButton = document.getElementById("start");
const bottomBar = document.getElementById("bottom-bar");

const CELL_SIZE_PX = 40;
const CELL_GAP_PX = 1;

function getAutoSize(): Vector {
  return [window.innerWidth, window.innerHeight].map(
    (v: number): number => {
      const rootHeight = Math.max(v, 400);
      const bottomBarHeight = bottomBar?.clientHeight || 0;
      const cellSize = CELL_SIZE_PX + CELL_GAP_PX * 2;
      return Math.floor((rootHeight - bottomBarHeight) / cellSize);
    }
  ) as Vector;
}

if (!root) {
  throw new Error("Root element not found");
}

const controller = new GameController(root);

function startGame() {
  controller.start();
}

startButton?.addEventListener("click", () => {
  startGame();
});

startGame();


document.addEventListener('click', function (event: MouseEvent) {
  if ((event.target as HTMLElement)?.matches('.btn')) {
    const audio = new Audio(btnClickSound);
    audio.play();
  }
});
