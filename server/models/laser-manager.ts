import { Socket } from "socket.io";
import { LaserBeam } from "../../shared/objects/laser-beam";
import { GameEventType, LaserBeamDTO } from "../../shared/types";
import { GameObjectManager } from "./game-object-manager";

export class LaserBeamManager extends GameObjectManager<LaserBeam, LaserBeamDTO> {
    constructor(roomId: string) {
        super(roomId, GameEventType.LaserMoved);
    }

    handleLaserBeamEmitted(socket: Socket, laserBeam: LaserBeamDTO) {
        this.objects.set(laserBeam.id, new LaserBeam(laserBeam));
        socket.to(this.roomId).emit(GameEventType.LaserMoved, laserBeam);
    }
}
