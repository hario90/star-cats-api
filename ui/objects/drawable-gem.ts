import gemImg1 from "../../assets/gem1.png";
import gemImg2 from "../../assets/gem2.png";
import gemImg3 from "../../assets/gem3.png";
import gemImg4 from "../../assets/gem4.png";
import gemImg5 from "../../assets/gem5.png";
import { getSectionsMap } from "../util";
import { GemDTO, GameObjectDTO, GameObjectType } from "../../shared/types";
import { Drawable } from "./drawable";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { ImageComponent } from "../component";
import { Canvas } from "../game-engine/canvas";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export interface DrawableGemProps extends GemDTO {
    eventEmitter: SocketEventEmitter;
    canvas: Canvas;
}

export class DrawableGem extends Drawable {
    private gemImg: ImageComponent;
    public readonly points: number;

    constructor(gem: DrawableGemProps) {
        super({ ...gem, type: GameObjectType.Gem });
        this.points = gem.points || 1;
        this.sections = getSectionsMap(this);
        this.loaded = true;
        this.width = 30;
        this.radius = 15;
        this.height = 30;
        this.speed = 0;
        let src = gemImg1;
        switch (this.points) {
            case 2:
                src = gemImg2;
                break;
            case 3:
                src = gemImg3;
                break;
            case 4:
                src = gemImg4;
                break;
            case 5:
                src = gemImg5;
                break;
        }
        this.gemImg = new ImageComponent({
            ...gem,
            speed: 0,
            height: this.height,
            width: this.width,
            src,
            srcHeight: 553,
            srcWidth: 553,
            frame: 0,
            frameLocations: [[0, 0]],
        });
    }

    isLoaded() {
        return this.gemImg.loaded;
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number) {
        if (!this.loaded) {
            console.error("This image has not loaded yet");
            return;
        }

        if (!this.isDead) {
            this.gemImg.draw(context, shipX, shipY);
        }
    }

    public update<T extends GameObjectDTO>(dto: T): void {
        const { x, y, speed, deg, height, width } = dto;
        this.speed = speed;
        this.deg = deg;
        this.height = height;
        this.width = width;
        this.x = x;
        this.y = y;
        this.sections = this.getCurrentSections();
        this.gemImg.update(dto);
    }

    public toDTO(): GemDTO {
        return {
            points: this.points,
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
