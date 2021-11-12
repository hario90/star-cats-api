import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png"
import { getRelativePosition } from "../util";
import { Asteroid } from "../../shared/objects/asteroid";
import { GameObject } from "../../shared/objects/game-object";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export class DrawableAsteroid extends ImageComponent {
  private frame = 2;
  public radius = 0;
  constructor(asteroid: Asteroid) {
    super({
      ...asteroid,
      src: asteroidImg,
    });
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
    context.drawImage(this.img, srcX, srcY, ASTEROID_WIDTH, ASTEROID_HEIGHT, x - this.radius, y - this.radius, this.width, this.height);
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
}
