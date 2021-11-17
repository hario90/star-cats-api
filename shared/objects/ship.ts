import { halfShipHeight, halfShipWidth } from "../constants";
import { GameObjectType, ShipDTO } from "../types";
import { GameObject } from "./game-object";

export class Ship extends GameObject {
    public name: string;

    constructor({id, x = 50, y = 50, deg = 0, speed = 1, height = 2 * halfShipHeight, width = 2 * halfShipWidth, name}: ShipDTO ) {
        super({id, x, y, deg, speed, height, width, type: GameObjectType.Ship});
        this.name = name;
    }
}