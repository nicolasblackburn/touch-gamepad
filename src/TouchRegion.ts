import { EventEmitter } from "./private/EventEmitter";
import { Rectangle } from "./private/Rectangle";
import { TouchSurface } from "./TouchSurface";

function inViewportRegion(point, region) {
  return region.x * window.innerWidth <= point.x &&
    point.x <= (region.x + region.width) * window.innerWidth &&
    region.y * window.innerHeight <= point.y &&
    point.y <= (region.y + region.height) * window.innerHeight;
}

interface TouchRegionOptions {
  touchInput: TouchSurface;
  region: Rectangle;
}

export class TouchRegion {
  private emitter: EventEmitter;
  private touchInput: TouchSurface;
  private region: Rectangle;

  constructor(options: TouchRegionOptions) {
    const {touchInput, region} = options;

    this.emitter = new EventEmitter();
    this.touchInput = touchInput;
    this.region = region;

    let start;
    const handlers = {
      tappressed: (event) => {
        if (event.type === 'tappressed' && inViewportRegion(event.touch, this.region)) {
          this.touchInput.on('tapreleased', handlers.tapreleased);
          this.emitter.emit(event.type, {
            type: event.type,
            from: event.touch
          });
        }
      },
      tapreleased: (event) => {
        if (event.type === 'tapreleased' && inViewportRegion(event.touch, this.region)) {
          this.touchInput.off('tapreleased');
          this.emitter.emit(event.type, {
            type: event.type,
            from: event.touch
          });
        }
      },
      touchstart: (event) => {
        if (event.type === 'touchstart' && inViewportRegion(event.touch, this.region) && !start) {
          start = {
            ...event.touch
          };
          this.touchInput.on('touchmove', handlers.touchmove);
          this.touchInput.on('touchend', handlers.touchend);
          this.touchInput.on('touchendoutside', handlers.touchendoutside);

          this.emitter.emit(event.type, {
            type: event.type,
            from: event.touch
          });
        }
      },
      touchmove: (event) => {
        if (event.type === 'touchmove' && start && event.touch.id === start.id) {
          this.emitter.emit(event.type, {
            type: event.type,
            from: start,
            to: event.touch
          });
        }
      },
      touchend: (event) => {
        if (event.type === 'touchend' && start && event.touch.id === start.id) {
          start = undefined;
          this.touchInput.off('touchmove', handlers.touchmove);
          this.touchInput.off('touchend', handlers.touchend);
          this.touchInput.off('touchendoutside', handlers.touchendoutside);
          this.emitter.emit(event.type, {
            type: event.type,
            from: start,
            to: event.touch
          });
        }
      },
      touchendoutside: (event) => {
        if (event.type === 'touchendoutside' && start && event.touch.id === start.id) {
          start = undefined;
          this.touchInput.off('touchmove', handlers.touchmove);
          this.touchInput.off('touchend', handlers.touchend);
          this.touchInput.off('touchendoutside', handlers.touchendoutside);
          this.emitter.emit(event.type, {
            type: event.type,
            from: start,
            to: event.touch
          });
        }
      }
    };
    this.touchInput.on('touchstart', handlers.touchstart);
    this.touchInput.on('tappressed', handlers.tappressed);
  }

  public on(event, fn, priority?) {
    this.emitter.on(event, fn, priority);
  }

  public off(event, fn) {
    this.emitter.off(event, fn);
  }
}