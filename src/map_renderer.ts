import { PubSub, Vector } from './types';

export interface RendererEvent<T = any> {
  target: HTMLElement;
  type: string;
  details: T;
}

export class MapRenderer implements PubSub {
  size: Vector;
  private map: HTMLElement[][];
  private root: HTMLElement;
  private mapRoot?: HTMLElement;
  private listeners: Map<string, Function[]> = new Map();
  private isMouseDown = false;

  constructor(root: HTMLElement, size: Vector) {
    this.root = root;
    this.size = size;
    this.map = [];

    this.root.addEventListener("click", this.handleCellClick);
    this.root.addEventListener("contextmenu", this.handleCellClick);
    this.root.addEventListener("keydown", this.handleCellKeydown);
    this.root.addEventListener("mousedown", () => {
      this.isMouseDown = true;
    });
    document.body.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });
    document.body.addEventListener("mouseover", (event) => {
      if (!this.isMouseDown) return;
      const target = event.target as HTMLElement;
      if (!target.classList.contains("cell") || !target.classList.contains("revealed")) return;
      this.handleCellEvent(target, "mouseover", false);
    });
  }

  getCellCoords(cell: HTMLElement): Vector {
    return [Number(cell.dataset.x), Number(cell.dataset.y)];
  }

  getCell(coords: Vector): HTMLElement {
    const [x, y] = coords;
    return this.map[y][x];
  }

  setCellValue(coords: Vector, value: string | number) {
    this.getCell(coords).innerHTML = String(value);
  }

  revealCell(coords: Vector, value: number) {
    const cell = this.getCell(coords);
    if (cell.classList.contains("revealed")) return;
    cell.classList.add("revealed");
    cell.classList.add(`revealed-${value}`)
    this.setCellValue(coords, value);
  }

  revealMines(state: number[][], win: boolean) {
    if (this.mapRoot) {
      this.mapRoot.classList.add(win ? "win" : "lose");
    }

    const [w, h] = this.size;
    for (let y = 0; y < h; y++) {
      const row = state[y];
      for (let x = 0; x < w; x++) {
        const value = row[x];
        if (value === -1) {
          this.setMine([x, y]);
        }
      }
    }
  }

  setFlag(coords: Vector, toggle = true): boolean {
    const cell = this.getCell(coords);
    if (toggle) {
      cell.classList.toggle("flagged");
      return cell.classList.contains("flagged");
    }

    cell.classList.add("flagged");
    return true;
  }

  setMine(coords: Vector) {
    const cell = this.getCell(coords);
    cell.classList.add("mine");
  }

  init() {
    this.root.innerHTML = "";
    const mapRoot = document.createElement("div");
    mapRoot.setAttribute("role", "grid");
    mapRoot.setAttribute("id", "map-root");
    this.root.appendChild(mapRoot);
    this.mapRoot = mapRoot;

    const [w, h] = this.size;
    const map: HTMLElement[][] = [];
    for (let y = 0; y < h; y++) {
      const rowEl = document.createElement("div");
      rowEl.classList.add("row");
      map[y] = [];
      for (let x = 0; x < w; x++) {
        const cellEl = document.createElement("div");
        cellEl.classList.add("cell");
        cellEl.classList.add(`cell-${x}-${y}`);
        cellEl.dataset.x = String(x);
        cellEl.dataset.y = String(y);
        cellEl.setAttribute("role", "button");
        cellEl.setAttribute("tabindex", "0");
        map[y]?.push(cellEl);
        rowEl.appendChild(cellEl);
      }
      mapRoot.appendChild(rowEl);
    }

    this.map = map;
  }

  destroy() {
    this.listeners.set('cell', []);
  }

  handleCellEvent(target: HTMLElement, type: string, isSecondary: boolean) {
    const coords = this.getCellCoords(target);
    const eventData: RendererEvent<{
      coords: Vector,
      isSecondary: boolean,
    }> = {
      type: type,
      target: target,
      details: {
        coords: coords,
        isSecondary: isSecondary,
      }
    };
    this.publish("cell", eventData);
  }

  handleCellClick = (event: MouseEvent) => {
    event.preventDefault();
    const type = "click";
    const isSecondary = event.button === 2;
    const target = event.target as HTMLElement;
    if (!target.classList.contains("cell")) return;
    this.handleCellEvent(target, type, isSecondary);
  }

  handleCellKeydown = (event: KeyboardEvent) => {
    if (event.key !== " " && event.key !== "r") return;
    if (event.key === "r") {
      this.publish('restart', { type: "restart", target: this.root, details: {} });
    }
    const type = "keydown";
    const isSecondary = event.key !== " ";
    const target = event.target as HTMLElement;
    if (!target.classList.contains("cell")) return;
    this.handleCellEvent(target, type, isSecondary);
  }

  subscribe(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event) || [];
    this.listeners.set(event, [...eventListeners, callback]);
    return callback;
  }

  unsubscribe(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      eventListeners.filter((cb) => cb !== callback)
    );
  }

  publish(event: string, data: RendererEvent) {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners?.length) return;
    eventListeners.forEach((callback) => callback(data));
  }

  dispatch(event: string, data: any) {
    this.publish(event, data);
  }

  on(event: string, callback: Function) {
    this.subscribe(event, callback);
  }

  off(event: string, callback: Function) {
    this.unsubscribe(event, callback);
  }
}
