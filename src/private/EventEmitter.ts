export class EventEmitter {
  private listeners: {[event: string]: ((...args: any[]) => void)[]};

  constructor() {
    this.listeners = {};
  }

  public on(event: string, fn: (...args: any[]) => void, priority?: number) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
  };

  public off(event: string, fn?: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      return;
    }

    if (!fn) {
      this.listeners[event].splice(0);
    } else {
      let i = 0;
      while (i < this.listeners[event].length) {
        if (this.listeners[event][i] === fn) {
          this.listeners[event].splice(i, 1);
        } else {
          i++;
        }
      }
    }
  };

  public emit<T>(event: string, data: T) {
    if (!this.listeners[event]) {
      return;
    }

    for (const fn of this.listeners[event]) {
      fn(data);
    }
  }
}