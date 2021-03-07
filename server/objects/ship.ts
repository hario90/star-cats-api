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
    public height = 16;
    public width = 16;

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
}