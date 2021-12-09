import { halfShipHeight, halfShipWidth } from "../constants";
import { GameObjectType, ShipDTO } from "../types";
import { GameObject } from "./game-object";

const MAX_HEALTH_POINTS = 10;
const MAX_NUM_LIVES = 5;

export class Ship extends GameObject {
    public name: string;
    public points: number;
    public healthPoints: number;
    public lives: number;

    constructor({id, x, y, healthPoints, lives, deg = 0, speed = 1, height = 2 * halfShipHeight, width = 2 * halfShipWidth, name, points}: ShipDTO) {
        super({id, x, y, deg, speed, height, width, type: GameObjectType.Ship});
        this.name = name || "Unnamed Vigilante";
        this.points = points ?? 0;
        this.healthPoints = healthPoints ?? 0;
        this.lives = lives ?? MAX_NUM_LIVES;
        this.healthPoints = healthPoints ?? MAX_HEALTH_POINTS;
    }

    getHeading(): number {
      return this.deg - 90;
    }

    reduceHealthPoints(reduceBy: number) {
      this.healthPoints -= reduceBy;
      if (this.healthPoints <= 0) {
        this.healthPoints = MAX_HEALTH_POINTS;
        this.lives--;
        this.lives = Math.max(this.lives, 0);
      }
    }

    public toDTO(): ShipDTO {
        return {
          x: this.x,
          y: this.y,
          height: this.height,
          width: this.width,
          name: this.name,
          id: this.id,
          points: this.points,
          deg: this.deg,
          speed: this.speed,
          type: this.type,
          healthPoints: this.healthPoints,
          lives: this.lives
        }
      }
}