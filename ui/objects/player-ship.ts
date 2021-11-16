import { v4 as uuid } from "uuid";
import { LaserBeamDTO } from "../../shared/types";
import { DrawableShip } from "./drawable-ship";

export const halfShipWidth = 16;
export const halfShipHeight = 15;
export const RAD = Math.PI / 180;

const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";
const UP = "ArrowUp";
const DOWN = "ArrowDown";
const SPACE = " ";
const DEGREE_INCREMENT = 10;
export const MAX_SPEED = 5;

// TODO decide on where to place each ship initially
export class PlayerShip extends DrawableShip {
  private onShoot: (laserBeam: LaserBeamDTO) => void;
  constructor(x: number, y: number, name: string, userId: string, onFinishedExploding: () => void, onShoot: (laserBeam: LaserBeamDTO) => void) {
    super({
      x,
      y,
      name,
      userId,
      onFinishedExploding
    });
    this.getPosition = this.getPosition.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.shoot = this.shoot.bind(this);
    this.onShoot = onShoot;
  }

  shoot() {
    const [x, y] = this.getNextPosition(Math.round(this.height / 2))
    const laserBeam: LaserBeamDTO = {
      x,
      y,
      // deg represents the angle going clockwise down from the positive x-axis
      deg: this.deg - 90,
      speed: 20,
      height: 30,
      width: 10,
      id: uuid(),
    }
    this.onShoot(laserBeam);
  }

  handleKeydown(e: KeyboardEvent) {
    switch(e.key) {
      case UP:
        e.preventDefault();
        if (this.speed < MAX_SPEED) {
          this.speed =  MAX_SPEED;
        }
        break;
      case DOWN:
        e.preventDefault();
        if (this.speed > 1) {
          this.speed--;
        }
        break;
      case LEFT:
        e.preventDefault();
        this.deg = this.deg - DEGREE_INCREMENT;
        if (this.deg < 0) {
          this.deg = 360 + this.deg;
        }
        break;
      case RIGHT:
        e.preventDefault();
        this.deg = (this.deg + DEGREE_INCREMENT) % 360;
        break;
      case SPACE:
        e.preventDefault();
        this.shoot();
        break;
    }
  }
}
