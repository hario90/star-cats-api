import { Drawable } from "./objects/drawable";

export interface ComponentProps {
  src: string;
  x: number;
  y: number;
}

export abstract class ImageComponent extends Drawable {
  protected img: HTMLImageElement;

  constructor({ src, x, y }: ComponentProps) {
    super();
    this.img = new Image();
    this.img.src = src;
    this.img.onload = () => { this.loaded = true; };
    this.x = x;
    this.y = y;
  }
}
