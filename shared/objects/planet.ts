import { GameObjectDTO, PlanetDTO } from "../types";
import { GameObject } from "./game-object";

export class Planet extends GameObject {
    constructor(planet: PlanetDTO) {
        super(planet);
    }

    toDTO(): GameObjectDTO {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            deg: this.deg,
            speed: this.speed,
            height: this.height,
            width: this.width,
            type: this.type,
            userControlled: this.userControlled,
        };
    }

    getHeading(): number {
        return this.deg;
    }
}