export interface ITicker {
  add(fn: (...args: any[]) => void): void;
  remove(fn: (...args: any[]) => void): void;
}