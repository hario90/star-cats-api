import {
    GameObjectDTO,
    GameObjectType,
    LaserBeamDTO,
    ISection,
    PlayerShipColor,
} from "../../shared/types";
import {
    COL_THICKNESS,
    isPointOverlappingWithSection,
    ROW_THICKNESS,
} from "../../shared/util";
import { Canvas } from "../game-engine/canvas";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { getRelativePosition } from "../util";
import { Drawable } from "./drawable";
import { Section } from "./section";

export interface DrawableLaserBeamProps extends LaserBeamDTO {
    eventEmitter: SocketEventEmitter;
    canvas: Canvas;
}
export class DrawableLaserBeam extends Drawable {
    public prevSection: Section | undefined;
    public readonly fromShipId: string;
    private color: string;

    constructor({ color, fromShipId, ...rest }: DrawableLaserBeamProps) {
        super({ ...rest, type: GameObjectType.LaserBeam });
        this.radius = 0;
        this.sections.set(this.section.key, this.section);
        this.fromShipId = fromShipId || "unknown";
        this.color = color;
    }

    get section(): Section {
        const row = Math.floor(this.y / ROW_THICKNESS);
        const col = Math.floor(this.x / COL_THICKNESS);
        const section = new Section(row, col);
        return section;
    }

    isLoaded() {
        return true;
    }

    getEndpoint() {
        return this.getNextPosition(this.height);
    }

    // We only care about the end of the laser beam - the part of the beam that strikes an object first
    // so we just figure out where that point is and what section it's at
    isOverlappingWithSection(section: ISection) {
        const endpoint = this.getEndpoint();
        return isPointOverlappingWithSection(endpoint, section);
    }

    draw(
        context: CanvasRenderingContext2D,
        shipX: number,
        shipY: number
    ): void {
        const halfCanvasWidth = this.canvas.halfWidth;
        const halfCanvasHeight = this.canvas.halfHeight;
        if (!this.isDead) {
            const [endX, endY] = this.getEndpoint();
            const { x, y } = getRelativePosition(
                halfCanvasWidth,
                halfCanvasHeight,
                shipX,
                shipY,
                this.x,
                this.y
            );
            const { x: relativeEndX, y: relativeEndY } = getRelativePosition(
                halfCanvasWidth,
                halfCanvasHeight,
                shipX,
                shipY,
                endX,
                endY
            );
            context.lineWidth = 4;
            context.strokeStyle = this.color;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(relativeEndX, relativeEndY);
            context.stroke();
        }
    }

    update<T extends GameObjectDTO>(obj: T): void {
        this.x = obj.x ?? this.x;
        this.y = obj.y ?? this.y;
        this.deg = obj.deg || 0;
        this.speed = obj.speed || 1;
        this.sections = new Map([[this.section.key, this.section]]);
    }

    public toDTO(): LaserBeamDTO {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            deg: this.deg,
            color: this.color,
            speed: this.speed,
            height: this.height,
            width: this.width,
            type: this.type,
            userControlled: this.userControlled,
        };
    }
}
