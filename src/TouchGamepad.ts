import { EventEmitter } from "./private/EventEmitter";
import { Rectangle } from "./private/Rectangle";
import { TouchSurface } from "./TouchSurface";
import { TouchRegion } from "./TouchRegion";

const TAP_THRESHOLD_MS = 100;
const DISTANCE_THRESHOLD_PX = 7;
const DEFAULT_OPTIONS = {
  axisDistance: 64,
  dualHands: true,
  virtualDPad: false
};

interface TouchGamepadOptions {
  axisDistance: number;
  dualHands: boolean;
  virtualDPad: boolean;
}

function createPoint(x: number, y: number) {
  return {x, y};
}

function createRectangle(x: number, y: number, width: number, height: number) {
  return {x, y, width, height};
}

function abs(r: {x: number, y: number}) {
  return Math.sqrt(r.x * r.x + r.y * r.y);
}

function sub(u: {x: number, y: number}, v: {x: number, y: number}) {
  return {
    x: u.x - v.x,
    y: u.y - v.y
  };
}

function mult(s: number, r: {x: number, y: number}) {
  return {
    x: s * r.x,
    y: s * r.y
  };
}

const PI_SQUARED = Math.PI * Math.PI;
function discreteAngle(samplesCount: number, {x, y}: {x: number, y: number}) {
  return ((Math.atan2(y, x) / PI_SQUARED * samplesCount + samplesCount + 1 / 2) % samplesCount | 0);
}

export class TouchGamepad {
  readonly axes: number[] = [0, 0];
  readonly buttons: {value: number, pressed: boolean}[] = [
    {value: 0, pressed: false}
  ];

  private config: TouchGamepadOptions;
  private emitter: EventEmitter;
  private touchRegion: TouchRegion;
  private secondaryTouchRegion: TouchRegion;
  private regionRectangles: Rectangle[];

  constructor(options: Partial<TouchGamepadOptions> = {}) {
    const {
      axisDistance,
      dualHands,
      virtualDPad
    } = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    this.config = {
      axisDistance,
      dualHands,
      virtualDPad
    };
    this.emitter = new EventEmitter();

    this.config.dualHands = false;

    const touchInput = new TouchSurface({
      delayTouchStart: !this.config.dualHands ? true : false,
      tapTimeThresold: !this.config.dualHands ? TAP_THRESHOLD_MS : 0, 
      touchStartDistanceThresold: !this.config.dualHands ? DISTANCE_THRESHOLD_PX : 0
    });

    this.regionRectangles = [
      createRectangle(0, 0, 1, 1),
      createRectangle(0, 0, 1 / 2, 1),
      createRectangle(1 / 2, 0, 1, 1)
    ];
    
    this.touchRegion = new TouchRegion({
      touchInput,
      region: !this.config.dualHands ? this.regionRectangles[0] : this.regionRectangles[1]
    });
    
    this.secondaryTouchRegion = new TouchRegion({
      touchInput,
      region: this.regionRectangles[2]
    });

    this.touchRegion.on('touchmove', ({from, to}) => {
      let displacement = sub(to, from);
      if (displacement.x === 0 && displacement.y === 0) {
        this.axes[0] = 0;
        this.axes[1] = 0;
      } else {
        const mag = abs(displacement);
        const normalizedValue = Math.min(this.config.axisDistance, mag) / this.config.axisDistance; 
        if (this.config.virtualDPad) {
          const angle = 2 * Math.PI * discreteAngle(8, displacement) / 8;
          displacement = mult(normalizedValue, createPoint(Math.cos(angle), Math.sin(angle)));
        } else {
          displacement = mult(normalizedValue / mag, displacement);
        }
        this.axes[0] = displacement.x;
        this.axes[1] = displacement.y;
      }
      if (!this.config.dualHands && this.buttons[0].pressed) {
        this.buttons[0].value = 0;
        this.buttons[0].pressed = false;
        this.emitter.emit('buttonup', {type: 'buttonup', index: 0, ...this.buttons[0]});
      }
      this.emitter.emit('axispressed', {type: 'axispressed', x: this.axes[0], y: this.axes[1], indexes: [0, 1]});
    });
    
    this.touchRegion.on('touchend', () => {
      this.axes[0] = 0;
      this.axes[1] = 0;
      this.emitter.emit('axisreleased', {type: 'axisreleased', x: this.axes[0], y: this.axes[1], indexes: [0, 1]});
    });

    this.touchRegion.on('touchendoutside', () => {
      this.axes[0] = 0;
      this.axes[1] = 0;
      this.emitter.emit('axisreleased', {type: 'axisreleased', x: this.axes[0], y: this.axes[1], indexes: [0, 1]});
    });

    this.touchRegion.on('tappressed', () => {
      if (!this.config.dualHands) {
        this.buttons[0].value = 1;
        this.buttons[0].pressed = true;
        this.emitter.emit('buttonpressed', {type: 'buttonpressed', index: 0, ...this.buttons[0]});
      }
    });

    this.touchRegion.on('tapreleased', () => {
      if (!this.config.dualHands) {
        this.buttons[0].value = 0;
        this.buttons[0].pressed = false;
        this.emitter.emit('buttonreleased', {type: 'buttonreleased', index: 0, ...this.buttons[0]});
      }
    });

    this.secondaryTouchRegion.on('touchstart', () => {
      if (this.config.dualHands) {
        this.buttons[0].value = 1;
        this.buttons[0].pressed = true;
        this.emitter.emit('buttonpressed', {type: 'buttonpressed', index: 0, ...this.buttons[0]});
      }
    });

    this.secondaryTouchRegion.on('touchend', () => {
      if (this.config.dualHands) {
        this.buttons[0].value = 0;
        this.buttons[0].pressed = false;
        this.emitter.emit('buttonreleased', {type: 'buttonreleased', index: 0, ...this.buttons[0]});
      }
    });
  }

  public on(event, fn, priority?) {
    this.emitter.on(event, fn, priority);
  }

  public off(event, fn) {
    this.emitter.off(event, fn);
  }
}