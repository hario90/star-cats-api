import { BattleShipFrame, Component } from "./types";
import shipImg from "../assets/ship.png";

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
const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";
const UP = "ArrowUp";
const DOWN = "ArrowDown";
const DEGREE_INCREMENT = 10;
export const MAX_SPEED = 5;

export class PlayerShip implements Component {
  public x: number = 0;
  public y: number = 0;
  public deg: number = 0;
  public speed: number = 1;
  private img: HTMLImageElement;
  private loaded = false;
  private canvasMidX: number;
  private canvasMidY: number;
  public showThrusters = false;

  constructor(canvasMidX: number, canvasMidY: number) {
    this.canvasMidX = canvasMidX;
    this.canvasMidY = canvasMidY;
    this.x = canvasMidX - halfShipWidth;
    this.y = canvasMidY - halfShipHeight;
    this.img = new Image();
    this.img.src = shipImg;
    this.img.onload = () => this.loaded = true;
    this.getPosition = this.getPosition.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
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

  draw(context: CanvasRenderingContext2D): void {
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
    context.translate(this.canvasMidX, this.canvasMidY);
    context.rotate(this.deg * RAD);
    context.drawImage(this.img, srcLocation[0], srcLocation[1], 2 * halfShipWidth, 2 * halfShipHeight, 0 - halfShipWidth, 0 - halfShipHeight, 2 * halfShipWidth, 2 * halfShipHeight);
    context.restore();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  handleKeydown(e: KeyboardEvent) {
    e.preventDefault();
    switch(e.key) {
      case UP:
        this.showThrusters = true;
        this.speed =  MAX_SPEED;
        break;
      case DOWN:
        if (this.speed > 1) {
          this.showThrusters = false;
          this.speed--;
        }
        break;
      case LEFT:
        this.deg = this.deg - DEGREE_INCREMENT;
        if (this.deg < 0) {
          this.deg = 360 + this.deg;
        }
        break;
      case RIGHT:
        this.deg = (this.deg + DEGREE_INCREMENT) % 360;
        break;
    }
  }
  
}
