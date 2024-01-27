import { Vector } from "./types";

const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 15;
const DEFAULT_MINES_COEF = 0.15;

export enum CellValues {
  MINE = -1,
  EMPTY = 0,
}

export enum CellState {
  HIDDEN = 0,
  REVEALED = 1,
  FLAGGED = 2,
}

export class GameMap {
  width: number;
  height: number;
  private minesCoef: number;
  private cells: CellValues[][];
  private cellsState: CellState[][];

  constructor(size?: Vector, minesCoef?: number) {
    const [w, h] = size || [DEFAULT_WIDTH, DEFAULT_HEIGHT];
    this.width = w;
    this.height = h;
    this.minesCoef = minesCoef || DEFAULT_MINES_COEF;
    const [cells, cellsState] = this.buildCells();
    this.cells = cells;
    this.cellsState = cellsState;
  }

  get size(): Vector {
    return [this.width, this.height];
  }

  get cellsCount(): number {
    return this.width * this.height;
  }

  get minesCount(): number {
    return Math.round(this.width * this.height * this.minesCoef);
  }

  isCleared(): boolean {
    const revealed = this.countRevealed();
    const toReveal = this.cellsCount - this.minesCount;
    return revealed === toReveal;
  }

  getValues(): CellValues[][] {
    return this.cells;
  }

  cell(coords: Vector) {
    const [x, y] = coords;
    return this.cells[y][x];
  }

  setCellValue(coords: Vector, value: number) {
    const [x, y] = coords;
    this.cells[y][x] = value;
  }

  cellState(coords: Vector) {
    const [x, y] = coords;
    return this.cellsState[y][x];
  }

  setCellState(coords: Vector, state: CellState) {
    const [x, y] = coords;
    this.cellsState[y][x] = state;
  }

  getAdjacentCoords(coords: Vector): Vector[] {
    const [x, y] = coords;
    const rows = this.cells.length;
    const cols = this.cells[0].length;
    const adjacent: Vector[] = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newY = y + i;
        const newX = x + j;
        if (newY >= 0 && newY < rows && newX >= 0 && newX < cols) {
          adjacent.push([newX, newY]);
        }
      }
    }

    return adjacent;
  }

  countMinesAround(coords: Vector) {
    let count = 0;
    const adjacent = this.getAdjacentCoords(coords);
    for (const adjacentCoords of adjacent) {
      const [x, y] = adjacentCoords;
      count += this.cell([x, y]) === CellValues.MINE ? 1 : 0;
    }
    return count;
  }

  revealCell(coords: Vector, recursive = true): Vector[] {
    const cellState = this.cellState(coords);
    if (cellState === CellState.REVEALED) return [];

    this.setCellState(coords, CellState.REVEALED);
    let revealed: Vector[] = [coords];

    if (recursive) {
      const cellValue = this.cell(coords);
      if (cellValue === CellValues.EMPTY) {
        const adjacent = this.getAdjacentCoords(coords);
        for (const adjacentCoords of adjacent) {
          revealed = revealed.concat(this.revealCell(adjacentCoords));
        }
      }
    }

    return revealed;
  }

  private buildCells(): [number[][], number[][]] {
    const cells = Array.from({ length: this.height }, () =>
      Array(this.width).fill(CellValues.EMPTY)
    );
    const cellsState = Array.from({ length: this.height }, () =>
      Array(this.width).fill(CellState.HIDDEN)
    );
    this.cells = cells;
    this.cellsState = cellsState;

    for (let i = 0; i < this.minesCount; i++) {
      let randomX, randomY;
      do {
        randomX = Math.floor(Math.random() * this.width);
        randomY = Math.floor(Math.random() * this.height);
      } while (this.cell([randomX, randomY]) === CellValues.MINE);
      this.setCellValue([randomX, randomY], CellValues.MINE);
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cell([x, y]) !== CellValues.MINE) {
          const minesAround = this.countMinesAround([x, y])
          this.setCellValue([x, y], minesAround);
        }
      }
    }

    this.cells = cells;

    return [cells, cellsState];
  }

  private countRevealed(): number {
    let count = 0;
    for (const row of this.cellsState) {
      for (const cell of row) {
        if (cell === CellState.REVEALED) count++;
      }
    }
    return count;
  }
}
