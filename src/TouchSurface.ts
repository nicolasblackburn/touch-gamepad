import { DefaultTicker } from "./private/DefaultTicker";
import { EventEmitter } from "./private/EventEmitter";
import { ITicker } from "./private/ITicker";
import { TouchState } from "./TouchState";

function findClosest(touch: {x: number, y: number}, touches) {
  const [closest] = touches.reduce(([min, minDist], {x, y, id, started, pressed}) => {
    const dx = touch.x - x;
    const dy = touch.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      return [{x: touch.x, y: touch.y, id, started, pressed}, dist];
    } else {
      return [min, minDist];
    }
  }, [{x: 0, y: 0, id: -1, started: false, pressed: false}, Number.POSITIVE_INFINITY]);
  if (closest.id >= 0) {
    return closest;
  }
}

function absSquare(x: number, y: number) {
  return x * x + y * y;
}

interface TouchSurfaceOptions {
  ticker?: ITicker; 
  delayTouchStart: boolean; 
  touchStartDistanceThresold: number; 
  tapTimeThresold: number;
}

export class TouchSurface {
  private emitter: EventEmitter;
  private ticker: ITicker;
  private distanceThreshold: number;
  private timeThreshold: number;
  private delayTouchStart: boolean;
  private touches: TouchState[] = [];

  constructor(options: TouchSurfaceOptions) {
    const {ticker, delayTouchStart, touchStartDistanceThresold, tapTimeThresold} = options;

    this.ticker = !ticker ? new DefaultTicker() : ticker;
    this.emitter = new EventEmitter();
    this.distanceThreshold = touchStartDistanceThresold;
    this.timeThreshold = tapTimeThresold;
    this.delayTouchStart = delayTouchStart;

    const handlers = {
      update: () => {

      },
      pointerdown: event => {
        this.touches.sort((a, b) => b.id - a.id);
        let id = 0;
        let i = 0;
        
        while (i < this.touches.length && id >= this.touches[i].id) {
          id = this.touches[i].id + 1;
          i++;
        }
        
        const touch = new TouchState(id, event.x, event.y);
        this.touches.push(touch);

        if (this.delayTouchStart) {
          // Here we start a timeout, if after a short delay, the touch haven't moved, then send a tapPressed
          const update = () => {
            if (performance.now() - touch.startTime >= this.timeThreshold) {
              this.ticker.remove(update);
              if (!touch.started && !touch.pressed) {
                touch.pressed = true;
                this.emit('tappressed', {
                  type: 'tappressed',
                  touches: this.touches,
                  touch
                });
              }
            }
          };
          this.ticker.add(update);
        } else {
          touch.started = true;
          this.emit('touchstart', {
            type: 'touchstart',
            touches: this.touches,
            touch
          });
        }
      },
      pointermove: event => {
        const touch = findClosest(event, this.touches);
        const distanceThresholdSquare = this.distanceThreshold * this.distanceThreshold;
        if (touch) {
          for (let i = 0; i < this.touches.length; i++) {
            if (this.touches[i].id === touch.id) {
              this.touches[i].x = touch.x;
              this.touches[i].y = touch.y;
              
              if (
                !this.touches[i].started && 
                absSquare(this.touches[i].x - this.touches[i].startX, this.touches[i].y - this.touches[i].startY) >= distanceThresholdSquare
              ) {
                this.touches[i].started = true;
                this.emit('touchstart', {
                  type: 'touchstart',
                  touches: this.touches,
                  touch
                });
              }

              break;
            } 
          }
          
          if (touch.started) {
            this.emit('touchmove', {
              type: 'touchmove',
              touches: this.touches,
              touch
            });
          }
        }
      },
      pointerup: event => {
        const touch = findClosest(event, this.touches);
        let oldTouch;
        if (touch) {
          const changed: TouchState[] = [];
          for (let i = 0; i < this.touches.length; i++) {
            if (this.touches[i].id !== touch.id) {
              changed.push(this.touches[i]);
            } else {
              oldTouch = this.touches[i];
            }
          }
          this.touches = changed;

          if (touch.started) {
            this.emit('touchend', {
              type: 'touchend',
              touches: this.touches,
              touch
            });
          } else {
            if (!touch.pressed) {
              oldTouch.pressed = true;
              this.emit('tappressed', {
                type: 'tappressed',
                touches: this.touches,
                touch
              });
            }
            this.emit('tapreleased', {
              type: 'tapreleased',
              touches: this.touches,
              touch
            });
          }
        }
      },
      pointerupoutside: event => {
        const touch = findClosest(event, this.touches);
        if (touch) {
          const changed: TouchState[] = [];
          for (let i = 0; i < this.touches.length; i++) {
            if (this.touches[i].id !== touch.id) {
              changed.push(this.touches[i]);
            } 
          }
          this.touches = changed;

          if (touch.started) {
            this.emit('touchendoutside', {
              type: 'touchendoutside',
              touches: this.touches,
              touch
            });
          }
        }
      }
    };

    for (const [event, handler] of Object.entries(handlers)) {
      document.addEventListener(event, handler);
    }
  }

  public on(event: string, fn: (...args: any[]) => void, priority?: number) {
    this.emitter.on(event, fn, priority);
  };

  public off(event: string, fn?: (...args: any[]) => void) {
    this.emitter.off(event, fn);
  };

  private emit<T>(event: string, data: T) {
    this.emitter.emit(event, data);
  }
}