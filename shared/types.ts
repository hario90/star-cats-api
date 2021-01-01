export interface PositionInfo {
    x: number;
    y: number;
    deg: number;
    speed: number;
}

export enum GameObjectType {
    Ship = "SHIP",
    Asteroid = "ASTEROID",
}

export interface GameObject extends PositionInfo {
    type: GameObjectType;
}