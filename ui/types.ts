export interface IDrawable {
  getPosition(): number[];
  setPosition(x: number, y: number): void;
  getSpeed(): number;
  getHeading(): number;
  getWidth(): number;
  getHeight(): number;
  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;
  isLoaded(): boolean;
  getUserId(): string | undefined;
}

export abstract class Drawable implements IDrawable {
  public height: number = 0;
  public width: number = 0;
  public x: number = 0;
  public y: number = 0;
  public speed: number = 0;
  public deg: number = 0;
  public loaded: boolean = false;
  public userId: string | undefined = undefined;

  getPosition(): number[] {
    return [this.x, this.y];
  }
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  getSpeed(): number {
    return this.speed;
  }
  getHeading(): number {
    return this.deg;
  }
  getWidth(): number {
    return this.width;
  }
  getHeight(): number {
    return this.height;
  }
  abstract draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;
  isLoaded(): boolean {
    return this.loaded;
  }
  getUserId(): string | undefined {
    return this.userId;
  }
}

export enum BattleShipFrame {
  NORMAL = "NORMAL",
  THRUST_LOW = "THRUST_LOW",
  THRUST_MED_LOW = "THRUST_MED_LOW",
  THRUST_MED = "THRUST_MED",
  THRUST_HI = "THRUST_HI",
}

export interface Alert {
  message: string;
  expires: Date;
}
