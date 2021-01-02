export interface Component {
  getPosition(): number[];
  setPosition(x: number, y: number): void;
  getSpeed(): number;
  getHeading(): number;
  getWidth(): number;
  getHeight(): number;
  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;
  isLoaded(): boolean;
}

export enum BattleShipFrame {
  NORMAL = "NORMAL",
  THRUST_LOW = "THRUST_LOW",
  THRUST_MED_LOW = "THRUST_MED_LOW",
  THRUST_MED = "THRUST_MED",
  THRUST_HI = "THRUST_HI",
}
