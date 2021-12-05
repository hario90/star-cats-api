import { RAD } from "../shared/constants";
import { GameObjectDTO } from "../shared/types";
import { Coordinate } from "../shared/util";
import { DrawableObject } from "./game-engine/types";
import { Drawable, DrawableProps } from "./objects/drawable";
import { getRelativePosition } from "./util";

export interface ComponentProps extends DrawableProps {
  src: string;
  srcWidth: number;
  srcHeight: number;
  frame: number;
  frameLocations: Coordinate[];
}

export class ImageComponent extends Drawable {
  private img: HTMLImageElement;
  public frame: number = 0;
  private frameLocations: Coordinate[];
  public loaded = false;
  private srcWidth: number;
  private srcHeight: number;

  constructor({ src, srcWidth, srcHeight, frame, frameLocations, ...rest }: ComponentProps) {
    super({...rest});
    this.img = new Image();
    this.img.src = src;
    this.img.onload = () => { this.loaded = true; };
    this.frame = frame;
    this.frameLocations = frameLocations;
    this.srcWidth = srcWidth;
    this.srcHeight = srcHeight;
  }

  whenHitBy(object: DrawableObject): void {
    // todo
  }

  public update<T extends GameObjectDTO>({x, y, speed, deg, height, width}: T): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }

  toDTO() {
    return {
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

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }

    context.save();
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    const frame = this.frameLocations[this.frame];
    if (!this.isDead && frame) {
      context.rotate(this.deg * RAD);
      const srcX = frame[0];
      const srcY = frame[1];
      context.drawImage(this.img, srcX, srcY, this.srcWidth, this.srcHeight, 0 - this.radius, 0 - this.radius, this.width, this.height);
    }
    context.restore();
  }
}
