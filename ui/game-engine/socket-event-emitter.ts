import { Socket } from "socket.io-client";
import { AsteroidDTO, GameEventType, GemDTO, LaserBeamDTO, ShipDamageArgs } from "../../shared/types";
import { DrawableObject } from "./types";

export class SocketEventEmitter {
    private readonly socket: Socket;
    constructor(socket: Socket) {
        this.socket = socket;
    }

    fireLaserBeam(laserBeam: LaserBeamDTO) {
        this.socket.emit(GameEventType.EmitLaserBeam, laserBeam);
    }

    deleteLaserBeam(id: string) {
        this.socket.emit(GameEventType.DeleteLaserBeam, id);
    }

    gameObjectMoved(emitType: GameEventType, object: DrawableObject, cb?: (dtos: DrawableObject[]) => void): void {
        if (object.isDead) {
            return;
        }

        this.socket.emit(emitType, object.toDTO(), cb);
    }

    shipDamaged(onShipDamage: (shipId: string, healthPoints: number, lives: number) => void, shipDamageArgs: ShipDamageArgs) {
        this.socket.emit(GameEventType.ShipDamage, shipDamageArgs, onShipDamage);
    }

    shipExploded(shipId: string, shipExploded: (shipId: string, lives: number, laserBeamId?: string) => void, laserBeamId?: string) {
        this.socket.emit(GameEventType.ShipExploded, shipId, laserBeamId, shipExploded);
    }

    asteroidHitByLaserBeam(asteroid: AsteroidDTO, laserBeamId: string, asteroidHit: (asteroidDTO1: AsteroidDTO, asteroidDTO2: AsteroidDTO) => void) {
        this.socket.emit(GameEventType.AsteroidHit, asteroid, laserBeamId, asteroidHit);
    }

    asteroidExploded(asteroidDTO: AsteroidDTO, laserBeamId: string, addGem: (gem: GemDTO) => void) {
        this.socket.emit(GameEventType.AsteroidExploded, asteroidDTO, laserBeamId, addGem);
    }

    shipPickedUpGem(shipId: string, gemId: string, cb: (shipId: string, gemId: string, shipPoints: number) => void) {
        this.socket.emit(GameEventType.ShipPickedUpGem, shipId, gemId, cb);
    }
}