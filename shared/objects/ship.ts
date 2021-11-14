import { halfShipHeight, halfShipWidth } from "../constants";
import { GameObjectType } from "../types";
import { GameObject, GameObjectDTO } from "./game-object";

export interface ShipProps extends GameObjectDTO {
    name: string;
}

export class Ship extends GameObject {
    public name: string;
    public userId: string; // todo remove

    constructor({id, x = 50, y = 50, deg = 0, speed = 1, height = 2 * halfShipHeight, width = 2 * halfShipWidth, name}: ShipProps ) {
        super({id, x, y, deg, speed, height, width, type: GameObjectType.Ship});
        this.name = name;
        this.userId = id;
    }
}