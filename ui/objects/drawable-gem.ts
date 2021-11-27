import gemImg from "../../assets/gem3.png";
import { getRelativePosition, getSectionsMap } from "../util";
import { GemDTO, GameObjectDTO } from "../../shared/types";
import { Drawable } from "./drawable";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject } from "../game-engine/types";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export interface DrawableGemProps extends GemDTO {
    eventEmitter: SocketEventEmitter;
}

export class DrawableGem extends Drawable {
  public readonly points: number;
  private img: HTMLImageElement;
  public loaded = false;

  constructor(gem: DrawableGemProps) {
    super(gem);
    this.points = gem.points || 1;
    this.sections = getSectionsMap(this);
    this.loaded = true;
    this.width = 30;
    this.radius = 15;
    this.height = 30;
    this.img = new Image();
    this.img.src = gemImg;
    this.img.onload = () => this.loaded = true;
  }

  isLoaded() {
    return this.loaded;
  }

  whenHitBy(object: DrawableObject): void {
    // the ship that hits it is in charge of emitting an event
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }

    context.save();
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    if (!this.isDead) {
        context.drawImage(this.img, 0, 0, 553, 553, x - this.radius, y - this.radius, this.width, this.width);
    }
    context.restore();
  }

  public update<T extends GameObjectDTO>({x, y, speed, deg, height, width}: T): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
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
        type: this.type
      };
  }
}
