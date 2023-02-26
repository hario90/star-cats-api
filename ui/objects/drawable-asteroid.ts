import { ImageComponent } from "../component";
import explosionImg from "../../assets/explosion.png";
import allAssets from "../../assets/sheet.png";
import * as assetsXML from "../../assets/sheet.xml";
import { getSectionsMap } from "../util";
import { AsteroidDTO, GameObjectDTO } from "../../shared/types";
import { EXPLOSION_LOCATIONS, SRC_EXPLOSION_WIDTH } from "../constants";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { Drawable } from "./drawable";
import { Canvas } from "../game-engine/canvas";
import { getImageComponentFromXML } from "./xml-drawing-utils";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;
export const EXPLOSION_WIDTH = 96;

export interface DrawableAsteroidProps extends AsteroidDTO {
    onFinishedExploding: (self: DrawableAsteroid) => void;
    eventEmitter: SocketEventEmitter;
    canvas: Canvas;
}

export class DrawableAsteroid extends Drawable {
    private asteroidImg: ImageComponent;
    private explosionImg: ImageComponent;
    private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
    private onFinishedExploding: (self: DrawableAsteroid) => void;
    public gemPoints: number;

    constructor(asteroid: DrawableAsteroidProps) {
        super(asteroid);
        this.gemPoints = asteroid.gemPoints || 1;
        const objectName = "meteorBrown_big1.png";
        const imageComponentFromXML = getImageComponentFromXML(
            allAssets,
            assetsXML,
            objectName,
            asteroid
        );
        if (imageComponentFromXML) {
            this.asteroidImg = imageComponentFromXML;
        } else {
            throw new Error("Couldn't find asteroid image!");
        }

        this.onFinishedExploding = asteroid.onFinishedExploding;
        this.explosionImg = new ImageComponent({
            ...asteroid,
            height: EXPLOSION_WIDTH,
            width: EXPLOSION_WIDTH,
            src: explosionImg,
            srcWidth: SRC_EXPLOSION_WIDTH,
            srcHeight: SRC_EXPLOSION_WIDTH,
            frame: 0,
            frameLocations: EXPLOSION_LOCATIONS,
        });

        this.sections = getSectionsMap(this);
        this.explode = this.explode.bind(this);
        this.drawExplosion = this.drawExplosion.bind(this);
    }

    public explode() {
        if (this.explosionIndex < 0 && !this.isDead) {
            this.isDead = true;
            this.explosionIndex = 0;
        }
    }

    isLoaded() {
        return this.asteroidImg.loaded && this.explosionImg.loaded;
    }

    private drawExplosion(
        context: CanvasRenderingContext2D,
        shipX: number,
        shipY: number
    ) {
        this.explosionImg.frame = this.getThrottledExplosionIndex();
        this.explosionImg.draw(context, shipX, shipY);

        this.explosionIndex++;

        if (this.getThrottledExplosionIndex() >= EXPLOSION_LOCATIONS.length) {
            this.onFinishedExploding(this);
        }
    }

    private getThrottledExplosionIndex() {
        return Math.floor(this.explosionIndex / 2);
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number) {
        if (!this.isLoaded()) {
            console.error("This image has not loaded yet");
            return;
        }

        if (
            this.isDead &&
            this.getThrottledExplosionIndex() < EXPLOSION_LOCATIONS.length
        ) {
            this.drawExplosion(context, shipX, shipY);
        } else if (!this.isDead) {
            this.asteroidImg.draw(context, shipX, shipY);
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
        this.asteroidImg.update(dto);
        this.explosionImg.update({
            ...dto,
            height: EXPLOSION_WIDTH,
            width: EXPLOSION_WIDTH,
        });
        this.sections = this.getCurrentSections();
    }

    public toDTO(): AsteroidDTO {
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
