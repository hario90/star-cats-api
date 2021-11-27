import { v4 as uuidV4 } from "uuid";
import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png";
import explosionImg from "../../assets/explosion.png";
import { getRelativePosition, getSectionsMap } from "../util";
import { AsteroidDTO, GameObjectDTO } from "../../shared/types";
import { EXPLOSION_LOCATIONS, EXPLOSION_WIDTH, HALF_EXPLOSION_WIDTH } from "../constants";
import { MIN_ASTEROID_HEIGHT } from "../../shared/constants";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject, isDrawableAsteroid, isDrawableLaserBeam } from "../game-engine/types";
import { Asteroid } from "../../shared/objects/asteroid";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;
const WIDTH_REDUCE_FACTOR = 0.8;

export interface DrawableAsteroidProps extends AsteroidDTO {
  onFinishedExploding: (self: DrawableAsteroid) => void;
  eventEmitter: SocketEventEmitter;
}

export class DrawableAsteroid extends ImageComponent {
  private frame = 2;
  private explosionImg: HTMLImageElement;
  private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
  private explosionLoaded = false;
  private onFinishedExploding: (self: DrawableAsteroid) => void;

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

  whenHitBy(object: DrawableObject): void {
    if (isDrawableAsteroid(object)) {
      // todo
    } else if (isDrawableLaserBeam(object)) {
      this.hit(object.id);
    }
  }

  private explode(laserBeamId: string) {
    if (this.explosionIndex < 0 && !this.isDead) {
      this.eventEmitter.asteroidExploded(this.id, laserBeamId);
      this.isDead = true;
      this.explosionIndex = 0;
    }
  }

  get points() {
    return Math.round(this.width / 10);
  }

  hit(laserBeamId: string) {
    if (this.width < MIN_ASTEROID_HEIGHT) {
      this.explode(laserBeamId);
    } else {
      // split asteroid into 2 asteroids half the original size, 180 deg apart
      const deg = this.getHeading();
      const nextPos1 = this.getNextPosition(Math.floor(this.radius / 2));
      const nextPos2 = this.getNextPosition(Math.floor(this.radius / 2), deg + 180);
      const asteroid1 = new Asteroid({
        ...this,
        width: this.radius,
        height: this.radius,
        id: uuidV4(),
        x: nextPos1[0],
        y: nextPos1[1]
      });
      const asteroid2 = new Asteroid({
        ...this,
        width: this.radius,
        height: this.radius,
        id: uuidV4(),
        x: nextPos2[0],
        y: nextPos2[1]
      });
      this.eventEmitter.asteroidHit(this.id, asteroid1.toDTO(), asteroid2.toDTO(), laserBeamId);
    }
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

  public update<T extends GameObjectDTO>({x, y, speed, deg, height, width}: T): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }

  public toDTO(): AsteroidDTO {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      deg: this.deg,
      speed: this.speed,
      height: this.height,
      width: this.width,
      type: this.type
    };
  }
}
