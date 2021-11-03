import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png"
import { getRelativePosition } from "../util";
import { Asteroid } from "../../server/objects/asteroid";
import { GameObject } from "../../shared/types";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export class DrawableAsteroid extends ImageComponent {
  private frame = 2;
  public radius = 0;
  constructor({id, x, y, speed, deg, height, width}: Asteroid) {
    super({
      id,
      src: asteroidImg,
      x,
      y,
    });
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.radius = Math.floor(this.width / 2)
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
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
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x - (this.width / 2), y - (this.height / 2));
    context.drawImage(this.img, srcX, srcY, ASTEROID_WIDTH, ASTEROID_HEIGHT, 0 - (this.width / 2), 0 - (this.height / 2), this.width, this.height);
    context.restore();
  }

  public update({x, y, speed, deg, height, width}: Asteroid): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }

  public toGameObject(): GameObject {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      deg: this.deg,
      speed: this.speed,
      height: this.height,
      width: this.width,
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY
    };
  }
}
