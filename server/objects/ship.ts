import { halfShipHeight, halfShipWidth } from "../../shared/constants";
import { GameObject, GameObjectType, IShip, PositionInfo } from "../../shared/types";


export class Ship implements IShip, GameObject {
    public id: string;
    public type: GameObjectType = GameObjectType.Ship;
    public x: number = 50;
    public y: number = 50;
    public deg: number = 0;
    public speed: number = 1;
    public name: string;
    public userId: string;
    public height = 2 * halfShipHeight;
    public width = 2 * halfShipWidth;

    constructor(name: string, userId: string) {
        this.id = userId;
        this.name = name;
        this.userId = userId;
    }

    move(positionInfo: PositionInfo) {
        const { x, y, deg, speed } = positionInfo;
        this.x = x;
        this.y = y;
        this.deg = deg;
        this.speed = speed;
    }

    get minX(): number {
        return this.x - (0.5 * this.width);
    }

    get minY(): number {
        return this.y - (0.5 * this.height);
    }

    get maxX(): number {
        return this.x + (0.5 * this.width);
    }

    get maxY(): number {
        return this.y + (0.5 * this.height);
    }

    getRadius() {
        return Math.floor(this.width / 2);
    }
}