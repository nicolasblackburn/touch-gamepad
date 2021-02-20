import { ITicker } from "./ITicker";

export class DefaultTicker implements ITicker {
  private callbacks: ((...args: any[]) => void)[] = [];

  constructor() {
    const update = () => {
      for (const fn of this.callbacks) {
        fn();
      }
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  public add(fn: (...args: any[]) => void) {
    this.callbacks.push(fn);
  }

  public remove(fn: (...args: any[]) => void) {
    let i = 0;
    while (i < this.callbacks.length) {
      if (this.callbacks[i] === fn) {
        this.callbacks.splice(i, 1);
      } else {
        i++;
      }
    }
  }
}