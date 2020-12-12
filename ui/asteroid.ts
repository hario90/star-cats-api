import { ImageComponent } from "./component";
import asteroidImg from "../assets/asteroid.png"

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;
export interface AsteroidProps {
  x: number,
  y: number,
  speed: number,
  deg: number,
  height: number,
  width: number,
}

export class Asteroid extends ImageComponent {
  private frame = 2;
  constructor({x, y, speed, deg, height, width}: AsteroidProps) {
    super({
      src: asteroidImg,
      x,
      y,
    });
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
  }

  draw(context: CanvasRenderingContext2D) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }
    let srcX = 0;
    let srcY = 0;
    if (this.frame === 2) {
      srcX = 32;
    }
    context.save();
    context.translate(this.x - (this.width / 2), this.y - (this.height / 2));
    context.drawImage(this.img, srcX, srcY, ASTEROID_WIDTH, ASTEROID_HEIGHT, 0 - (this.width / 2), 0 - (this.height / 2), this.width, this.height);
    context.restore();
  }
}