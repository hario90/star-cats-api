import { ImageComponent } from "../component";
import planetImg from "../../assets/wet-planet.png";
import { getSectionsMap } from "../util";
import { PlanetDTO, GameObjectDTO } from "../../shared/types";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { Drawable } from "./drawable";
import { Canvas } from "../game-engine/canvas";

export const PLANET_HEIGHT = 100;
export const PLANET_WIDTH = 100;
const NUM_FRAMES = 51;

export interface DrawablePlanetProps extends PlanetDTO {
    eventEmitter: SocketEventEmitter;
    canvas: Canvas;
}

export class DrawablePlanet extends Drawable {
    private planetImg: ImageComponent;
    private animationIndex = 0;

    constructor(planet: DrawablePlanetProps) {
        super(planet);
        const frameLocations: Array<[number, number]> = [];
        for (let i = 0; i < NUM_FRAMES; i++) {
            frameLocations.push([i * PLANET_WIDTH, 0]);
        }
        this.planetImg = new ImageComponent({
            ...planet,
            src: planetImg,
            srcWidth: PLANET_WIDTH,
            srcHeight: PLANET_HEIGHT,
            frame: 0,
            frameLocations,
        });
        this.sections = getSectionsMap(this);
    }

    isLoaded() {
        return this.planetImg.loaded;
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number) {
        if (!this.isLoaded()) {
            console.error("This image has not loaded yet");
            return;
        }

        if (!this.isDead) {
            this.animationIndex++;
            this.planetImg.frame = this.getThrottledExplosionIndex();
            if (this.getThrottledExplosionIndex() >= NUM_FRAMES) {
                this.animationIndex = 0;
            }
            this.planetImg.draw(context, shipX, shipY);
        }
    }

    private getThrottledExplosionIndex() {
        return Math.floor(this.animationIndex / 2);
    }

    public update<T extends GameObjectDTO>(dto: T): void {
        const { x, y, speed, deg, height, width } = dto;
        this.speed = speed;
        this.deg = deg;
        this.height = height;
        this.width = width;
        this.x = x;
        this.y = y;
        this.planetImg.update(dto);
        this.sections = this.getCurrentSections();
    }

    public toDTO(): PlanetDTO {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            deg: this.deg,
            speed: this.speed,
            height: this.height,
            width: this.width,
            type: this.type,
            userControlled: this.userControlled,
        };
    }
}
