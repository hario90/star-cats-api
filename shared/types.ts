export interface PositionInfo extends PositionInfoDTO {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    getRadius(): number;
}

export interface PositionInfoDTO {
    x: number;
    y: number;
    deg: number;
    speed: number;
    height: number;
    width: number;
}

export enum GameObjectType {
    Unknown = "UNKNOWN",
    Ship = "SHIP",
    Asteroid = "ASTEROID",
    LaserBeam = "LASER_BEAM"
}

export interface IGameObject extends PositionInfo {
    id: string;
    type: GameObjectType;
}

export interface ShipDTO extends PositionInfoDTO {
    name: string;
    userId: string;
}

export interface LaserBeamDTO extends PositionInfoDTO {
    id: string;
    color?: string;
}

export interface SocketAuth {
    name: string;
    userId: string;
    canvasHeight: number;
    canvasWidth: number;
}

export enum GameEventType {
    Announce = "ANNOUNCE",
    Ships = "SHIPS",
    GameObjectMoved = "SHIP_MOVED",
    UserLeft = "USER_LEFT",
    UserJoined = "USER_JOINED",
    ShipDamage = "SHIP_DAMAGE",
    ShipExploded = "SHIP_EXPLODED",
    EmitLaserBeam = "EMIT_LASER_BEAM"
}