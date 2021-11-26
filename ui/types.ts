import { GameObjectType, IGameObject } from "../shared/types";
import { DrawableAsteroid } from "./objects/drawable-asteroid";
import { DrawableGem } from "./objects/drawable-gem";
import { DrawableLaserBeam } from "./objects/drawable-laser-beam";
import { DrawableShip } from "./objects/drawable-ship";

export interface IDrawable extends IGameObject{
  getPosition(): number[];
  setPosition(x: number, y: number): void;
  getSpeed(): number;
  getHeading(): number;
  getWidth(): number;
  getHeight(): number;
  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;
  isLoaded(): boolean;
  getUserId(): string | undefined;
  getNextPosition(): [number, number];
  isInFrame(canvasWidth: number, canvasHeight: number): boolean;
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

export interface Stats {
  points: number;
  lives: number;
}