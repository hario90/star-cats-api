import { GameObjectType, PositionInfo } from "../types";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    constructor(id: string, x: number, y: number, height: number, width: number, speed = 0, deg = 0) {
        super({id, x, y, height, width, deg, speed, type: GameObjectType.Asteroid});
    }
}