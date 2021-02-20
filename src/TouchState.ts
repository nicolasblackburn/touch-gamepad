export class TouchState {
  public id: number;
  public x: number;
  public y: number;
  public startX: number;
  public startY: number;
  public pressed: boolean;
  public started: boolean;
  public startTime: number;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.pressed = false;
    this.started = false;
    this.startTime = performance.now();
  }
}