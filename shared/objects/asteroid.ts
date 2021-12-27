import { AsteroidDTO } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    public readonly gemPoints: number;

    constructor(asteroid: AsteroidDTO) {
        super(asteroid);
        this.gemPoints = asteroid.gemPoints || 1;
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
            type: this.type,
            gemPoints: this.gemPoints,
            userControlled: this.userControlled,
        };
    }
}
