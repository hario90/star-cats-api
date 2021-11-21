import { Socket } from "socket.io-client";
import { GameObjectDTO, GameObjectType, LaserBeamDTO, ISection } from "../../shared/types";
import { COL_THICKNESS, distanceBetweenObjects, getSectionKey, isPointOverlappingWithSection, NUM_COLUMNS, NUM_ROWS, ROW_THICKNESS } from "../../shared/util";
import { getRelativePosition } from "../util";
import { Drawable } from "./drawable";
import { DrawableAsteroid } from "./drawable-asteroid";
import { DrawableShip } from "./drawable-ship";

export class DrawableLaserBeam extends Drawable {
    public section: ISection;
    constructor({color, ...rest}: LaserBeamDTO) {
        super({...rest, type:GameObjectType.LaserBeam});
        this.radius = 0;
        this.section = this.getSection();
    }

    getSection() {
        let row = 0;
        let col = 0;
        let minX = 0;
        let maxX = COL_THICKNESS;
        let minY = 0;
        let maxY = ROW_THICKNESS;
        while (maxX < this.x && col < NUM_COLUMNS) {
            col++;
            minX += COL_THICKNESS;
            maxX += COL_THICKNESS;
        }
        while (maxY < this.y && row < NUM_ROWS) {
            row++;
            minY += ROW_THICKNESS;
            maxY += ROW_THICKNESS;
        }
        return {
            row,
            col,
            minX,
            maxX,
            minY,
            maxY
        };
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

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void {
        const [endX, endY] = this.getEndpoint();
        const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
        const {x: relativeEndX, y: relativeEndY} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, endX, endY);
        context.strokeStyle = "#03fcdf";
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(relativeEndX, relativeEndY);
        context.stroke();
    }

    update<T extends GameObjectDTO>(obj: T, sectionToAsteroids: Map<string, Set<DrawableAsteroid>>, sectionToShips: Map<string, Set<DrawableShip>>, sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>>, socket: Socket): void {
        this.x = obj.x ?? this.x;
        this.y = obj.y ?? this.y;
        this.deg = obj.deg || 0;
        this.speed = obj.speed || 1;
        const prevSection = this.section;
        this.section = this.getSection();
        if (this.section.row !== prevSection.row || this.section.col !== prevSection.col) {
            const laserBeamsInSection = sectionToLaserBeams.get(getSectionKey(prevSection.row, prevSection.col)) || new Set();
            laserBeamsInSection.delete(this);
            const laserBeamsInNewSection = sectionToLaserBeams.get(getSectionKey(this.section.row, this.section.col)) || new Set();
            laserBeamsInNewSection.add(this);
        }

        // check for collisions and explode the object we collide into
        const {row, col} = this.section;
        const sectionKey = getSectionKey(row, col);
        const shipsInMySection = sectionToShips.get(sectionKey) || new Set();
        for (const ship of shipsInMySection) {
            if (distanceBetweenObjects(ship, this) <= 0) {
                ship.explode(socket);
            }
        }
        const asteroidsInMySection = sectionToAsteroids.get(sectionKey) || new Set();
        for (const asteroid of asteroidsInMySection) {
            if (distanceBetweenObjects(asteroid, this) <= 0) {
                asteroid.explode(socket);
            }
        }
    }
}