import { GameObjectDTO } from "../shared/objects/game-object";
import { Drawable } from "./objects/drawable";

export interface ComponentProps extends GameObjectDTO {
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
