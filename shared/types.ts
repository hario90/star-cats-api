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
    LaserBeam = "LASER_BEAM",
    Gem = "GEM"
}

export interface IGameObject extends PositionInfo {
    id: string;
    type: GameObjectType;
    userControlled: boolean;
}

export interface GameObjectDTO extends PositionInfoDTO {
    id: string;
    type: GameObjectType;
    userControlled: boolean;
}

export interface ShipDTO extends GameObjectDTO {
    name?: string;
    points?: number;
    healthPoints?: number;
    lives?: number;
}

export interface LaserBeamDTO extends GameObjectDTO {
    color?: string;
    fromShipId?: string;
}

export interface AsteroidDTO extends GameObjectDTO {
    // An asteroid turns into 2 smaller asteroids when hit
    // and explodes when it reaches a certain size threshold.
    // After it explodes, a gem replaces the asteroid.
    // We need to pre-calculate this for consistency purposes
    // gemId will be equal to the asteroidId
    gemPoints?: number;
    asteroidId1?: string;
    asteroidId2?: string;
}

export interface GemDTO extends GameObjectDTO {
    points?: number;
}

export const isShipDTO = (obj: GameObjectDTO): obj is ShipDTO => obj.type === GameObjectType.Ship;
export const isLaserBeamDTO = (obj: GameObjectDTO): obj is LaserBeamDTO => obj.type === GameObjectType.LaserBeam;
export const isAsteroidDTO = (obj: GameObjectDTO): obj is AsteroidDTO => obj.type === GameObjectType.Asteroid

export interface SocketAuth {
    name: string;
    userId: string;
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
    EmitLaserBeam = "EMIT_LASER_BEAM",
    AddGem = "ADD_GEM",
    ShipPickedUpGem = "SHIP_PICKED_UP_GEM",
    AsteroidHit = "ASTEROID_HIT",
    DeleteLaserBeam = "DELETE_LASER_BEAM",
}

export interface ISection {
    row: number;
    col: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface ShipDamageArgs {
    laserBeamId?: string;
    shipId?: string;
    asteroidId?: string
}