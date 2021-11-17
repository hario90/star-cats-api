import { AsteroidDTO } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    constructor(asteroid: AsteroidDTO) {
        super(asteroid);
    }
}