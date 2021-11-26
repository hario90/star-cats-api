import { AsteroidDTO } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    public readonly points: number;
    constructor(asteroid: AsteroidDTO) {
        super(asteroid);
        this.points = Math.round(this.width / 10);
    }

    public toDTO(): AsteroidDTO {
        return {
          id: this.id,
          x: this.x,
          y: this.y,
          deg: this.deg,
          speed: this.speed,
          height: this.height,
          width: this.width,
          type: this.type
        };
      }
}