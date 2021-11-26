import { GameObjectDTO } from "../shared/types";
import { Drawable, DrawableProps } from "./objects/drawable";

export interface ComponentProps extends DrawableProps {
  src: string;
}

// TODO remove class
export abstract class ImageComponent extends Drawable {
  protected img: HTMLImageElement;

  constructor({ src, ...rest }: ComponentProps) {
    super({...rest});
    this.img = new Image();
    this.img.src = src;
    this.img.onload = () => { this.loaded = true; };
  }
}
