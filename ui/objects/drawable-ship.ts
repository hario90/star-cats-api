import { BattleShipFrame, Component } from "../types";
import shipImg from "../../assets/ship.png";
import { getRelativePosition } from "../util";
import { Ship } from "../../server/objects/ship";

export const halfShipWidth = 16;
export const halfShipHeight = 15;
export const RAD = Math.PI / 180;

const frameToLocation = new Map([
  [BattleShipFrame.NORMAL, [0, 0]],
  [BattleShipFrame.THRUST_LOW, [2 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED_LOW, [4 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED, [0, 2 * halfShipHeight]],
  [BattleShipFrame.THRUST_HI, [2 * halfShipWidth, 2 * halfShipHeight]]
]);

const speedToFrame = new Map([
  [1, BattleShipFrame.NORMAL],
  [2, BattleShipFrame.THRUST_LOW],
  [3, BattleShipFrame.THRUST_MED_LOW],
  [4, BattleShipFrame.THRUST_MED],
  [5, BattleShipFrame.THRUST_HI],
]);

const DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS = 90;
export const MAX_SPEED = 5;

export interface DrawableShipProps {
  socketId: string;
  name: string;
  deg?: number;
  speed?: number;
  x: number;
  y: number;
}

export class DrawableShip implements Component {
  public socketId: string;
  public name: string;
  public x: number = 0;
  public y: number = 0;
  public deg: number = 0;
  public speed: number = 1;
  private img: HTMLImageElement;
  private loaded = false;

  constructor(ship: DrawableShipProps) {
    this.socketId = ship.socketId;
    this.name = ship.name;
    this.x = ship.x - halfShipWidth;
    this.y = ship.y - halfShipHeight;
    this.deg = ship.deg || 0;
    this.speed = ship.speed || 1;
    this.img = new Image();
    this.img.src = shipImg;
    this.img.onload = () => this.loaded = true;
    this.getPosition = this.getPosition.bind(this);
  }

  getPosition(): number[] {
    return [this.x, this.y];
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  getWidth(): number {
    return 2 * halfShipWidth;
  }

  getHeight(): number {
    return 2 * halfShipHeight
  }

  getHeading() {
    return this.deg - DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS;
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void {
    if (!this.loaded) {
      console.error("Image has not loaded yet");
      return;
    }
    const frame = speedToFrame.get(this.speed) || BattleShipFrame.NORMAL;
    const srcLocation = frameToLocation.get(frame);
    if (!srcLocation) {
      throw new Error(`Could not find source image for the frame: ${frame}`);
    } else if (srcLocation.length < 2) {
      throw new Error(`Something is wrong with the frameToLocation map`);
    }
    context.save();
    // always render ship at center of screen
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    context.font = "14px Arial";
    context.fillStyle = "white";
    context.fillText(this.name, halfShipWidth, 0);
    context.rotate(this.deg * RAD);
    context.drawImage(this.img, srcLocation[0], srcLocation[1], 2 * halfShipWidth, 2 * halfShipHeight, 0 - halfShipWidth, 0 - halfShipHeight, 2 * halfShipWidth, 2 * halfShipHeight);
    context.restore();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getSocketId(): string | undefined {
    return this.socketId;
  }
}
