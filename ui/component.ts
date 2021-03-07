import { Drawable } from "./objects/drawable";

export interface ComponentProps {
  id: string;
  src: string;
  x: number;
  y: number;
}

export abstract class ImageComponent extends Drawable {
  protected img: HTMLImageElement;

  constructor({ id, src, x, y }: ComponentProps) {
    super(id);
    this.img = new Image();
    this.img.src = src;
    this.img.onload = () => { this.loaded = true; };
    this.x = x;
    this.y = y;
  }
}
