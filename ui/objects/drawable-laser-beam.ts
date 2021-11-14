import { Socket } from "socket.io-client";
import { GameObject } from "../../shared/objects/game-object";
import { GameObjectType, LaserBeamDTO } from "../../shared/types";
import { getRelativePosition } from "../util";
import { Drawable } from "./drawable";
import { DrawableAsteroid } from "./drawable-asteroid";

export class DrawableLaserBeam extends Drawable {
    constructor({color, ...rest}: LaserBeamDTO) {
        super({...rest, type:GameObjectType.LaserBeam});
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void {
        const [endX, endY] = this.getNextPosition(this.height);
        const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
        const {x: relativeEndX, y: relativeEndY} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, endX, endY);
        context.strokeStyle = "#03fcdf";
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(relativeEndX, relativeEndY);
        context.stroke();
    }

    update<T extends GameObject>(obj: T, sectionToAsteroids: Map<string, DrawableAsteroid[]>, socket: Socket): void {
        this.x = obj.x ?? this.x;
        this.y = obj.y ?? this.y;
        this.deg = obj.deg || 0;
        this.speed = obj.speed || 1;
    }
}