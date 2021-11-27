import { Socket } from "socket.io-client";
import { AsteroidDTO, GameEventType, LaserBeamDTO } from "../../shared/types";
import { DrawableObject } from "./types";

export class SocketEventEmitter {
    private readonly socket: Socket;
    constructor(socket: Socket) {
        this.socket = socket;
    }

    fireLaserBeam(laserBeam: LaserBeamDTO) {
        this.socket.emit(GameEventType.EmitLaserBeam, laserBeam);
    }

    gameObjectMoved(emitType: GameEventType, object: DrawableObject): void {
        if (object.isDead) {
            return;
        }

        this.socket.emit(emitType, object.toDTO());
    }

    shipDamaged(shipId: string, healthPoints: number) {
        this.socket.emit(GameEventType.ShipDamage, shipId, healthPoints);
    }

    shipExploded(shipId: string, laserBeamId?: string) {
        this.socket.emit(GameEventType.ShipExploded, shipId, laserBeamId);
    }

    asteroidHit(asteroidId: string, asteroid1: AsteroidDTO, asteroid2: AsteroidDTO, laserBeamId?: string) {
        this.socket.emit(GameEventType.AsteroidHit, asteroidId, asteroid1, asteroid2, laserBeamId);
    }

    asteroidExploded(asteroidDTO: AsteroidDTO, laserBeamId?: string) {
        this.socket.emit(GameEventType.AsteroidExploded, asteroidDTO, laserBeamId);
    }

    shipPickedUpGem(shipId: string, gemId: string) {
        this.socket.emit(GameEventType.ShipPickedUpGem, shipId, gemId);
    }
}