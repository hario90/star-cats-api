import { Socket } from "socket.io";
import { GameEventType, GameObjectDTO } from "../../shared/types";
import { GameObject } from "../../shared/objects/game-object";

export abstract class GameObjectTracker<T extends GameObject, DTO extends GameObjectDTO> {
    protected objects = new Map<string, T>();

    constructor(protected roomId: string) {
        this.getObjects = this.getObjects.bind(this);
        this.handleObjectMoved = this.handleObjectMoved.bind(this);
    }

    public getObjects(): Map<string, T> {
        return this.objects;
    }

    public handleObjectMoved(socket: Socket, obj: DTO): void {
        const matchingObject = this.objects.get(obj.id)
        if (matchingObject) {
            matchingObject.move(obj);
            socket.to(this.roomId).emit(
                GameEventType.ShipMoved,
                matchingObject.toDTO()
            );
        }
    }


}