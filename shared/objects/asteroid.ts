import { v4 as uuidV4 } from "uuid";
import { AsteroidDTO } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    public readonly gemPoints: number;
    public readonly asteroidId1: string;
    public readonly asteroidId2: string;

    constructor(asteroid: AsteroidDTO) {
        super(asteroid);
        this.gemPoints = asteroid.gemPoints || 1;
        this.asteroidId1 = asteroid.asteroidId1 ?? uuidV4();
        this.asteroidId2 = asteroid.asteroidId2 ?? uuidV4();
    }

    getHeading() {
      return this.deg;
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