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

export interface GameObjectDTO extends PositionInfoDTO {
    id: string;
    type: GameObjectType;
}

export interface ShipDTO extends GameObjectDTO {
    name: string;
}

export interface LaserBeamDTO extends GameObjectDTO {
    color?: string;
}

export interface AsteroidDTO extends GameObjectDTO {
    color?: string;
}

export const isShipDTO = (obj: GameObjectDTO): obj is ShipDTO => obj.type === GameObjectType.Ship;
export const isLaserBeamDTO = (obj: GameObjectDTO): obj is LaserBeamDTO => obj.type === GameObjectType.LaserBeam;
export const isAsteroidDTO = (obj: GameObjectDTO): obj is AsteroidDTO => obj.type === GameObjectType.Asteroid

export interface SocketAuth {
    name: string;
    userId: string;
    canvasHeight: number;
    canvasWidth: number;
    x: number;
    y: number;
}

export enum GameEventType {
    Announce = "ANNOUNCE",
    GetInitialObjects = "GET_INITIAL_OBJECTS",
    ShipMoved = "SHIP_MOVED",
    AsteroidMoved = "ASTEROID_MOVED",
    LaserMoved = "LASER_MOVED",
    UserLeft = "USER_LEFT",
    UserJoined = "USER_JOINED",
    ShipDamage = "SHIP_DAMAGE",
    AsteroidExploded = "ASTEROID_EXPLODED",
    ShipExploded = "SHIP_EXPLODED",
    EmitLaserBeam = "EMIT_LASER_BEAM"
}

export interface ISection {
    row: number;
    col: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}