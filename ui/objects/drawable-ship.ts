import { BattleShipFrame } from "../types";
import explosionImg from "../../assets/explosion.png";
import shipImg from "../../assets/ship.png";
import { getRelativePosition } from "../util";
import { Drawable } from "./drawable";
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

const explosionWidth = 128;
const halfExplosionWidth = explosionWidth / 2;
const explosionLocations = [
  [0, 0],
  [explosionWidth, 0],
  [2*explosionWidth, 0],
  [3*explosionWidth, 0],
  [0, explosionWidth],
  [explosionWidth, explosionWidth],
  [2*explosionWidth, explosionWidth],
  [3*explosionWidth, explosionWidth],
  [0, 2*explosionWidth],
  [explosionWidth, 2*explosionWidth],
  [2*explosionWidth, 2*explosionWidth],
  [3*explosionWidth, 2*explosionWidth],
  [0, 3*explosionWidth],
  [explosionWidth, 3*explosionWidth]
];

const DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS = 90;
export const MAX_SPEED = 5;

export interface DrawableShipProps {
  userId: string;
  name: string;
  deg?: number;
  speed?: number;
  x: number;
  y: number;
  onFinishedExploding: () => void;
}

export class DrawableShip extends Drawable {
  public name: string;
  public isDead = false;
  public speed: number = 1;
  private shipImg: HTMLImageElement;
  private explosionImg: HTMLImageElement;
  private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
  private explosionLoaded = false;
  private onFinishedExploding: () => void;

  constructor(ship: DrawableShipProps) {
    super(ship.userId);
    this.userId = ship.userId;
    this.name = ship.name;
    this.x = ship.x;
    this.y = ship.y;
    this.deg = ship.deg || 0;
    this.speed = ship.speed || 1;
    this.shipImg = new Image();
    this.shipImg.src = shipImg;
    this.shipImg.onload = () => this.loaded = true;
    this.onFinishedExploding = ship.onFinishedExploding;

    this.explosionImg = new Image();
    this.explosionImg.src = explosionImg;
    this.explosionImg.onload = () => this.explosionLoaded = true;

    this.getPosition = this.getPosition.bind(this);
    this.explode = this.explode.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
  }

  public update(ship: Ship): void {
    this.x = ship.x;
    this.y = ship.y;
    this.deg = ship.deg || 0;
    this.speed = ship.speed || 1;
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

  explode() {
    this.isDead = true;
    this.explosionIndex = 0;
  }

  isLoaded() {
    return this.loaded && this.explosionLoaded;
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number,
    halfCanvasWidth: number, halfCanvasHeight: number): void {
    if (!this.loaded) {
      console.error("Image has not loaded yet");
      return;
    }

    context.save();
    // always render ship at center of screen
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    context.font = "14px Arial";
    context.fillStyle = "white";

    if (!this.isDead) {
      context.fillText(this.name, halfShipWidth, 0);
    }

    context.rotate(this.deg * RAD);
    if (this.explosionIndex > -1 && this.explosionIndex < explosionLocations.length) {
      const location = explosionLocations[Math.floor(this.explosionIndex / 2)];
      context.drawImage(this.explosionImg, location[0], location[1], explosionWidth, explosionWidth, 0 - halfExplosionWidth, 0-halfExplosionWidth, explosionWidth, explosionWidth);
      this.explosionIndex++;

      if (this.explosionIndex >= explosionLocations.length) {
        this.onFinishedExploding();
      }

    } else if (!this.isDead) {
      const frame = speedToFrame.get(this.speed) || BattleShipFrame.NORMAL;
      const srcLocation = frameToLocation.get(frame);
      if (!srcLocation) {
        throw new Error(`Could not find source image for the frame: ${frame}`);
      } else if (srcLocation.length < 2) {
        throw new Error(`Something is wrong with the frameToLocation map`);
      }
      context.drawImage(this.shipImg, srcLocation[0], srcLocation[1], 2 * halfShipWidth, 2 * halfShipHeight, 0 - halfShipWidth, 0 - halfShipHeight, 2 * halfShipWidth, 2 * halfShipHeight);
    }

    context.restore();
  }

}
