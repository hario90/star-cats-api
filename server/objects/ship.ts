import { GameObject, GameObjectType, PositionInfo } from "../../shared/types";

export interface ShipPositionInfo extends PositionInfo {
    showThrusters: boolean;
}

export interface IShip extends ShipPositionInfo {
    name: string;
    socketId: string; // guid from socket.id
}

export class Ship implements IShip, GameObject {
    public type: GameObjectType = GameObjectType.Ship;
    public x: number = 50;
    public y: number = 50;
    public deg: number = 0;
    public speed: number = 1;
    public showThrusters = false;
    public name: string;
    public socketId: string;

    constructor(name: string, socketId: string) {
        this.name = name;
        this.socketId = socketId;
    }

    move(positionInfo: ShipPositionInfo) {
        const { x, y, deg, showThrusters } = positionInfo;
        this.x = x;
        this.y = y;
        this.deg = deg;
        this.showThrusters = showThrusters;
    }
}