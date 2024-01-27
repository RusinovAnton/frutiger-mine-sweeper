export type Vector = [number, number];

export interface PubSub {
  subscribe: (event: string, callback: Function) => void;
  unsubscribe: (event: string, callback: Function) => void;
  publish: (event: string, data: any) => void;
  dispatch: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}
