import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png";
import explosionImg from "../../assets/explosion.png";
import { getRelativePosition } from "../util";
import { Socket } from "socket.io-client";
import { AsteroidDTO, GameEventType, GameObjectDTO, ISection } from "../../shared/types";
import { DrawableShip } from "./drawable-ship";
import { getSectionsMap } from "../../shared/util";
import { DrawableLaserBeam } from "./drawable-laser-beam";
import { EXPLOSION_LOCATIONS, EXPLOSION_WIDTH, HALF_EXPLOSION_WIDTH } from "../constants";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export interface DrawableAsteroidProps extends AsteroidDTO {
  onFinishedExploding: (self: DrawableAsteroid) => void;
}

export class DrawableAsteroid extends ImageComponent {
  private frame = 2;
  private explosionImg: HTMLImageElement;
  private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
  private explosionLoaded = false;
  private onFinishedExploding: (self: DrawableAsteroid) => void;
  public sections: Map<string, ISection>;

  constructor(asteroid: DrawableAsteroidProps) {
    super({
      ...asteroid,
      src: asteroidImg,
    });
    this.onFinishedExploding = asteroid.onFinishedExploding;
    this.explosionImg = new Image();
    this.explosionImg.src = explosionImg;
    this.explosionImg.onload = () => this.explosionLoaded = true;

    this.sections = getSectionsMap(this);
    this.explode = this.explode.bind(this);
    this.drawExplosion = this.drawExplosion.bind(this);
  }

  explode(socket: Socket, laserBeamId: string) {
    socket.emit(GameEventType.AsteroidExploded, this.id, laserBeamId);
    this.isDead = true;
    this.explosionIndex = 0;
  }

  isLoaded() {
    return this.loaded && this.explosionLoaded;
  }

  private drawExplosion(context: CanvasRenderingContext2D) {
    const location = EXPLOSION_LOCATIONS[this.getThrottledExplosionIndex()];
    context.drawImage(this.explosionImg, location[0], location[1], EXPLOSION_WIDTH, EXPLOSION_WIDTH, 0 - HALF_EXPLOSION_WIDTH, 0-HALF_EXPLOSION_WIDTH, EXPLOSION_WIDTH, EXPLOSION_WIDTH);
    this.explosionIndex++;

    if (this.getThrottledExplosionIndex() >= EXPLOSION_LOCATIONS.length) {
      this.onFinishedExploding(this);
    }
  }

  private getThrottledExplosionIndex() {
    return Math.floor(this.explosionIndex / 2);
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }

    context.save();
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    if (this.isDead && this.getThrottledExplosionIndex() < EXPLOSION_LOCATIONS.length) {
      this.drawExplosion(context);
    } else if (!this.isDead) {
      let srcX = 0;
      let srcY = 0;
      if (this.frame === 2) {
        srcX = 32;
      }
      context.drawImage(this.img, srcX, srcY, ASTEROID_WIDTH, ASTEROID_HEIGHT, 0 - this.radius, 0 - this.radius, this.width, this.height);
    }
    context.restore();
  }

  public update<T extends GameObjectDTO>({x, y, speed, deg, height, width}: T, sectionToAsteroids: Map<string, Set<DrawableAsteroid>>, sectionToShips: Map<string, Set<DrawableShip>>, sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>>, socket: Socket): void {
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
