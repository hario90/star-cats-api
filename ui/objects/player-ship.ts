import { Socket } from "socket.io-client";
import { GameEventType, LaserBeamDTO } from "../../shared/types";
import { DrawableShip } from "./drawable-ship";

export const halfShipWidth = 16;
export const halfShipHeight = 15;
export const RAD = Math.PI / 180;

const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";
const UP = "ArrowUp";
const DOWN = "ArrowDown";
const SPACE = "Spacebar";
const DEGREE_INCREMENT = 10;
export const MAX_SPEED = 5;

// TODO decide on where to place each ship initially
export class PlayerShip extends DrawableShip {
  private socket: Socket;
  constructor(x: number, y: number, name: string, userId: string, onFinishedExploding: () => void, socket: Socket) {
    super({
      x,
      y,
      name,
      userId,
      onFinishedExploding
    });
    this.socket = socket;
    this.getPosition = this.getPosition.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.shoot = this.shoot.bind(this);
  }

  shoot() {
    const [x, y] = this.getNextPosition(Math.round(this.height / 2))
    const laserBeam: LaserBeamDTO = {
      x,
      y,
      deg: this.deg,
      speed: 10,
      height: 50,
      width: 10,
    }
    this.socket.emit(GameEventType.EmitLaserBeam, laserBeam)
  }

  handleKeydown(e: KeyboardEvent) {
    e.preventDefault();
    switch(e.key) {
      case UP:
        if (this.speed < MAX_SPEED) {
          this.speed =  MAX_SPEED;
        }
        break;
      case DOWN:
        if (this.speed > 1) {
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
      case SPACE:
        this.shoot();
        break;
    }
  }
}
