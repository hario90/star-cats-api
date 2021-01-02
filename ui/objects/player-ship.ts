import { Ship } from "./ship";

export const halfShipWidth = 16;
export const halfShipHeight = 15;
export const RAD = Math.PI / 180;

const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";
const UP = "ArrowUp";
const DOWN = "ArrowDown";
const DEGREE_INCREMENT = 10;
export const MAX_SPEED = 5;

// TODO decide on where to place each ship initially
export class PlayerShip extends Ship {
  constructor(canvasMidX: number, canvasMidY: number, name: string) {
    super(canvasMidX, canvasMidY, name);
    this.getPosition = this.getPosition.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
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
