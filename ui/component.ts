import { RAD } from "../shared/constants";
import { GameObjectDTO } from "../shared/types";
import { Coordinate } from "../shared/util";
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
  private colorToCanvas: Map<string, HTMLCanvasElement> = new Map();

  constructor({ src, srcWidth, srcHeight, frame, frameLocations, ...rest }: ComponentProps) {
    super({...rest});
    this.img = new Image();
    this.img.src = src;
    this.img.onload = this.onImageLoaded;
    this.frame = frame;
    this.frameLocations = frameLocations;
    this.srcWidth = srcWidth;
    this.srcHeight = srcHeight;
  }

  onImageLoaded = () => {
    this.loaded = true;
  }

  createTint = (color: string): HTMLCanvasElement => {
     // create a fully green version of img
     const c=document.createElement('canvas');
     const cctx=c.getContext('2d');
     if (!cctx) {
       return c;
     }

     c.width=this.img.width;
     c.height=this.img.height;
     cctx.drawImage(this.img,0,0);
     cctx.globalCompositeOperation='source-atop';
     cctx.fillStyle= color;
     cctx.fillRect(0,0,this.img.width,this.img.height);
     cctx.globalCompositeOperation='source-over';
     this.colorToCanvas.set(color, c);
     return c;
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
      type: this.type,
      userControlled: this.userControlled,
    };
  }

  drawTinted = (context: CanvasRenderingContext2D, shipX: number, shipY: number, color: string) => {
    const halfCanvasWidth = this.canvas.halfWidth;
    const halfCanvasHeight = this.canvas.halfHeight;
    let c = this.colorToCanvas.get(color);
    if (!c) {
      c = this.createTint(color);
    }

    context.save();
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    const frame = this.frameLocations[this.frame];

    // draw the grayscale image onto the canvas
    if (!this.isDead && frame) {
      context.rotate(this.deg * RAD);
      const srcX = frame[0];
      const srcY = frame[1];
      context.drawImage(this.img, srcX, srcY, this.srcWidth, this.srcHeight, 0 - this.radius, 0 - this.radius, this.width, this.height);

      // set compositing to color (changes hue with new overwriting colors)
      context.globalCompositeOperation='color';

      // draw the fully green img on top of the grayscale image
      // ---- the img is now greenscale ----
      context.drawImage(c,srcX, srcY, this.srcWidth, this.srcHeight, 0 - this.radius, 0 - this.radius, this.width, this.height);
    }

    context.restore();

    // Always clean up -- change compositing back to default
    context.globalCompositeOperation='source-over';
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }

    const halfCanvasWidth = this.canvas.halfWidth;
    const halfCanvasHeight = this.canvas.halfHeight;

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
