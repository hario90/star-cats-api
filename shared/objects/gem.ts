import { AsteroidDTO, GameObjectType } from "../types";
import { GameObject } from "./game-object";

export class Gem extends GameObject {
    constructor(props: AsteroidDTO) {
        super({...props, type: GameObjectType.Gem});
    }
}