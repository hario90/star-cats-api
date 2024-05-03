import { Socket } from "socket.io";
import { GameEventType, GameObjectDTO } from "../../shared/types";
import { GameObject } from "../../shared/objects/game-object";

export abstract class GameObjectManager<T extends GameObject, DTO extends GameObjectDTO> {
    protected objects = new Map<string, T>();

    constructor(protected roomId: string, protected moveEvent: GameEventType) {
        this.getObjects = this.getObjects.bind(this);
        this.getObjectById = this.getObjectById.bind(this);
        this.handleObjectMoved = this.handleObjectMoved.bind(this);
        this.deleteObjectById = this.deleteObjectById.bind(this);
    }

    // could be a selector
    public getObjects(): Map<string, T> {
        return this.objects;
    }

    // could be a selector
    public getObjectById(id: string): T | undefined{
        return this.objects.get(id);
    }

    public handleObjectMoved(socket: Socket, obj: DTO): void {
        const matchingObject = this.objects.get(obj.id)
        if (matchingObject) {
            matchingObject.move(obj);
            socket.to(this.roomId).emit(
                this.moveEvent,
                matchingObject.toDTO()
            );
        }
    }

    public deleteObjectById(objectId: string) {
        this.objects.delete(objectId);
    }
}