import { halfShipHeight, halfShipWidth } from "../constants";
import { GameObjectType, ShipDTO } from "../types";
import { GameObject } from "./game-object";

export class Ship extends GameObject {
    public name: string;
    public points: number = 0;

    constructor({id, x = 50, y = 50, deg = 0, speed = 1, height = 2 * halfShipHeight, width = 2 * halfShipWidth, name, points}: ShipDTO ) {
        super({id, x, y, deg, speed, height, width, type: GameObjectType.Ship});
        this.name = name;
        this.points = points;
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
        }
      }
}