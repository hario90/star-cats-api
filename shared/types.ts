export interface PositionInfo {
    x: number;
    y: number;
    deg: number;
    speed: number;
    height: number;
    width: number;
}

export enum GameObjectType {
    Ship = "SHIP",
    Asteroid = "ASTEROID",
}

export interface GameObject extends PositionInfo {
    id: string;
    type: GameObjectType;
}

export interface IShip extends PositionInfo {
    name: string;
    userId: string;
}

export interface SocketAuth {
    name: string;
    userId: string;
    canvasHeight: number;
    canvasWidth: number;
}

export enum GameEventType {
    Ships = "SHIPS",
    ShipMoved = "SHIP_MOVED",
    UserLeft = "USER_LEFT",
    UserJoined = "USER_JOINED",
    ShipDamage = "SHIP_DAMAGE",
    ShipExploded = "SHIP_EXPLODED",
}