import { AsteroidDTO } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    public readonly points: number;
    constructor(asteroid: AsteroidDTO) {
        super(asteroid);
        this.points = Math.round(this.width / 10);
    }
}