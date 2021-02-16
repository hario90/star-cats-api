import { GameObject, GameObjectType, PositionInfo } from "../../shared/types";

export class Asteroid implements GameObject {
    public type: GameObjectType = GameObjectType.Asteroid;
    public x: number;
    public y: number;
    public deg: number = 0;
    public speed: number = 0;
    public height = 16;
    public width = 16;

    constructor(x: number, y: number, height: number, width: number, speed = 0, deg = 0) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.speed = speed;
        this.deg = deg;
    }

    move(positionInfo: PositionInfo) {
        const { x, y, deg, speed } = positionInfo;
        this.x = x;
        this.y = y;
        this.deg = deg;
        this.speed = speed;
    }
}