import { AsteroidDTO, GameObjectType, GemDTO } from "../types";
import { GameObject } from "./game-object";

export class Gem extends GameObject {
    public readonly points = 1;
    constructor(props: AsteroidDTO) {
        super({...props, type: GameObjectType.Gem});
    }
}