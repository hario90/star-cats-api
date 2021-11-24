import { Socket } from "socket.io-client";
import { GameObjectDTO, GameObjectType, LaserBeamDTO, ISection } from "../../shared/types";
import { COL_THICKNESS, distanceBetweenObjects, getSectionKey, isPointOverlappingWithSection, NUM_COLUMNS, NUM_ROWS, ROW_THICKNESS } from "../../shared/util";
import { getRelativePosition } from "../util";
import { Drawable } from "./drawable";
import { DrawableAsteroid } from "./drawable-asteroid";
import { DrawableShip } from "./drawable-ship";
import { Section } from "./section";

export class DrawableLaserBeam extends Drawable {
    private prevSection: Section | undefined;
    constructor({color, ...rest}: LaserBeamDTO) {
        super({...rest, type:GameObjectType.LaserBeam});
        this.radius = 0;
        this.sections.set(this.section.key, this.section);
    }

    get section(): Section {
        const row = Math.floor(this.y / ROW_THICKNESS);
        const col = Math.floor(this.x / COL_THICKNESS);
        const section =  new Section(row, col)
        this.sections.clear();
        this.sections.set(section.key, section);
        return section;
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
        if (!this.isDead) {
            const [endX, endY] = this.getEndpoint();
            const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
            const {x: relativeEndX, y: relativeEndY} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, endX, endY);
            context.strokeStyle = "#03fcdf";
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(relativeEndX, relativeEndY);
            context.stroke();
        }
    }

    update<T extends GameObjectDTO>(obj: T, sectionToAsteroids: Map<string, Set<DrawableAsteroid>>, sectionToShips: Map<string, Set<DrawableShip>>, sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>>, socket: Socket): void {
        this.x = obj.x ?? this.x;
        this.y = obj.y ?? this.y;
        this.deg = obj.deg || 0;
        this.speed = obj.speed || 1;

        if (this.prevSection && (this.section.row !== this.prevSection?.row || this.section.col !== this.prevSection?.col)) {
            const laserBeamsInSection = sectionToLaserBeams.get(getSectionKey(this.prevSection.row, this.prevSection.col)) || new Set();
            laserBeamsInSection.delete(this);
            const laserBeamsInNewSection = sectionToLaserBeams.get(getSectionKey(this.section.row, this.section.col)) || new Set();
            laserBeamsInNewSection.add(this);
        }
        this.prevSection = this.section;

        // check for collisions and explode the object we collide into
        const {row, col} = this.section;
        const sectionKey = getSectionKey(row, col);
        const shipsInMySection = sectionToShips.get(sectionKey) || new Set();
        for (const ship of shipsInMySection) {
            if (distanceBetweenObjects(ship, this) <= 0) {
                ship.explode(socket, this.id);
                this.isDead = true;
                break;
            }
        }
        const asteroidsInMySection = sectionToAsteroids.get(sectionKey) || new Set();
        for (const asteroid of asteroidsInMySection) {
            if (distanceBetweenObjects(asteroid, this) <= 0) {
                asteroid.hit(socket, this.id);
                this.isDead = true;
                break;
            }
        }
    }
}