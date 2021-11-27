import { Socket } from "socket.io-client";
import { GameEventType, LaserBeamDTO } from "../../shared/types";
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

    asteroidHit(asteroidId: string, asteroidWidth: number, laserBeamId?: string) {
        this.socket.emit(GameEventType.AsteroidHit, asteroidId, laserBeamId, asteroidWidth);
    }

    asteroidExploded(asteroidId: string, laserBeamId?: string) {
        this.socket.emit(GameEventType.AsteroidExploded, asteroidId, laserBeamId);
    }

    shipPickedUpGem(shipId: string, gemId: string) {
        this.socket.emit(GameEventType.ShipPickedUpGem, shipId, gemId);
    }
}