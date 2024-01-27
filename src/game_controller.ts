import { GameMap, CellState, CellValues } from "./game_map";
import { GameSounds } from "./game_sounds";
import { MapRenderer, RendererEvent } from "./map_renderer";
import { Vector } from "./types";

const sounds = new GameSounds();

enum GameState {
  NOT_STARTED = 0,
  STARTED = 1,
  WON = 2,
  LOST = 3,
}

const minesCountEl = document.getElementById('mines-count');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');

class Timer {
  startedAt: number | null = null;
  interval?: number;

  get isStarted() {
    return this.startedAt !== null;
  }

  start() {
    this.startedAt = Date.now();
  }

  stop() {
    this.startedAt = null;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  getElapsed() {
    if (!this.isStarted) {
      return 0;
    }
    return Date.now() - this.startedAt!;
  }

  getElapsedString() {
    const elapsed = this.getElapsed();
    const milliseconds = Math.floor(elapsed % 1000 / 10);
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const secondsString = (seconds % 60).toString().padStart(2, '0');
    if (hours) return `${hours}:${minutes}:${secondsString}`;
    const millisecondsString = milliseconds.toString().padStart(2, '0');
    return `${minutes}:${secondsString}:${millisecondsString}`;
  }

  onTick(callback: () => void) {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      if (this.isStarted) {
        callback();
      }
    }, 10);
  }
}

export class GameController {
  private score = 0;
  private root: HTMLElement;
  private size?: Vector;
  private map: GameMap;
  private renderer: MapRenderer;
  private timer = new Timer();
  state: GameState = GameState.NOT_STARTED;

  constructor(root: HTMLElement, size?: Vector) {
    this.root = root;
    this.size = size;
    this.map = new GameMap(size);
    this.renderer = new MapRenderer(root, this.map.size);
  }

  handleCellAction = (event: RendererEvent) => {
    if (this.state === GameState.NOT_STARTED) {
      this.timer.start();
      this.state = GameState.STARTED;
    }
    const { coords, isSecondary } = event.details;
    const cellValue = this.map.cell(coords);
    const cellState = this.map.cellState(coords);
    let actionSound = 'reveal';

    if (cellState === CellState.REVEALED) {
      if (cellValue === CellValues.EMPTY) {
        return
      }

      actionSound = ('check');
      const adjacent = this.map.getAdjacentCoords(coords);
      let flagged = 0;
      let hidden = 0;
      for (const neighbor of adjacent) {
        const state = this.map.cellState(neighbor);
        if (state === CellState.FLAGGED) flagged++;
        if (state === CellState.HIDDEN) hidden++;
      }

      if (flagged === cellValue && hidden) {
        actionSound = hidden > 1 ? 'multiReveal' : 'reveal';
        for (const adjacentCoords of adjacent) {
          const state = this.map.cellState(adjacentCoords);
          if (state !== CellState.FLAGGED) {
            const toReveal = this.map.revealCell(adjacentCoords);
            let hasMine = false;
            for (const coords of toReveal) {
              const cellValue = this.map.cell(coords);
              if (cellValue === CellValues.MINE) {
                this.renderer.setMine(coords);
                hasMine = true;
              } else {
                this.renderer.revealCell(coords, cellValue);
              }
            }
            if (hasMine) {
              this.gameOver();
              actionSound = ('mine');
            }
          }
        }
      } else if (hidden && flagged + hidden === cellValue) {
        actionSound = ('flag');
        for (const adjacentCoords of adjacent) {
          const state = this.map.cellState(adjacentCoords);
          if (state !== CellState.FLAGGED && state !== CellState.REVEALED) {
            this.renderer.setFlag(adjacentCoords, false);
            this.map.setCellState(adjacentCoords, CellState.FLAGGED);
          }
        }
      }
    } else if (isSecondary) {
      const isFlagged = this.renderer.setFlag(coords);
      this.map.setCellState(coords, isFlagged ? CellState.FLAGGED : CellState.HIDDEN);

      actionSound = ('flag');
    } else if (cellState === CellState.FLAGGED) {
      return;
    } else if (cellValue === CellValues.MINE) {
      this.renderer.setMine(coords);
      this.gameOver();
      actionSound = ('mine');
    } else {
      const toReveal = this.map.revealCell(coords);
      let hasMine = false;
      for (const coords of toReveal) {
        const cellValue = this.map.cell(coords);
        if (cellValue === CellValues.MINE) {
          this.renderer.setMine(coords);
          hasMine = true;
        } else {
          this.renderer.revealCell(coords, cellValue);
        }
      }
      if (hasMine) {
        this.gameOver();
        actionSound = ('mine');
      }
    }

    if (this.map.isCleared()) {
      this.gameOver(true);
      actionSound = ('win');
    }

    if (actionSound) {
      sounds.play(actionSound);
    }
  }

  start() {
    if (this.state === GameState.STARTED) {
      this.restart();
    } else if (this.state > GameState.STARTED) {
      this.state = GameState.NOT_STARTED;
    }

    this.map = new GameMap(this.size);
    this.renderer = new MapRenderer(this.root, this.map.size);
    this.renderer.init();
    this.renderer.on("cell", this.handleCellAction);
    this.renderer.on("restart", () => {
      this.restart();
    });

    if (minesCountEl) minesCountEl.innerHTML = this.map.minesCount.toString();
    this.updateTimerElement()
    this.timer.onTick(() => {
      this.updateTimerElement()
    });
  }

  updateTimerElement() {
    if (timerEl) timerEl.innerHTML = this.timer.getElapsedString();
  }

  restart() {
    this.gameOver();
    this.start();
  }

  gameOver(win = false) {
    this.timer.stop();
    this.renderer.destroy();
    this.state = win ? GameState.WON : GameState.LOST;
    const getValues = this.map.getValues();
    this.renderer.revealMines(getValues, win);
  }
}
