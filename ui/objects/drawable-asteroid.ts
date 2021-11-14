import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png"
import { getRelativePosition } from "../util";
import { Asteroid } from "../../shared/objects/asteroid";
import { GameObject } from "../../shared/objects/game-object";
import { Socket } from "socket.io-client";

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

  public update<T extends GameObject>({x, y, speed, deg, height, width}: T, objectMap: Map<string, DrawableAsteroid[]>, socket: Socket): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;

  //   // check if it has collided
  //   const shipSections: string[] = getSections(ship);
  //   const asteroidsToCheckForCollision = new Set<GameObject>();
  //   for (const shipSectionKey of shipSections) {
  //     const objects = objectMap.get(shipSectionKey) || [];
  //     // no asteroids logged but there should be.
  //     for (const obj of objects) {
  //       // TODO: .toJSON shouldn't be necessary
  //       asteroidsToCheckForCollision.add(obj.toJSON());
  //     }
  //   }

  //   // A ship crashed into an asteroid!
  //   if (hasCollided(ship, Array.from(asteroidsToCheckForCollision))) {
  //     socket.emit(GameEventType.ShipExploded, ship.id)
  //     this.explode();
  //   }
  }
}
