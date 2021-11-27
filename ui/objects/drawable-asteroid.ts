import { v4 as uuidV4 } from "uuid";
import { ImageComponent } from "../component";
import asteroidImg from "../../assets/asteroid.png";
import explosionImg from "../../assets/explosion.png";
import { getSectionsMap } from "../util";
import { AsteroidDTO, GameObjectDTO } from "../../shared/types";
import { EXPLOSION_LOCATIONS, SRC_EXPLOSION_WIDTH } from "../constants";
import { MIN_ASTEROID_HEIGHT } from "../../shared/constants";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject, isDrawableAsteroid, isDrawableLaserBeam } from "../game-engine/types";
import { Asteroid } from "../../shared/objects/asteroid";
import { Drawable } from "./drawable";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;
export const EXPLOSION_WIDTH = 96;

export interface DrawableAsteroidProps extends AsteroidDTO {
  onFinishedExploding: (self: DrawableAsteroid) => void;
  eventEmitter: SocketEventEmitter;
}

export class DrawableAsteroid extends Drawable {
  private asteroidImg: ImageComponent;
  private explosionImg: ImageComponent;
  private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
  private onFinishedExploding: (self: DrawableAsteroid) => void;

  constructor(asteroid: DrawableAsteroidProps) {
    super(asteroid);
    this.asteroidImg = new ImageComponent({
      ...asteroid,
      src: asteroidImg,
      srcWidth: ASTEROID_WIDTH,
      srcHeight: ASTEROID_HEIGHT,
      frame: 0,
      frameLocations: [[0, 0], [ASTEROID_WIDTH, 0]]
    });
    this.onFinishedExploding = asteroid.onFinishedExploding;
    this.explosionImg = new ImageComponent({
      ...asteroid,
      height: EXPLOSION_WIDTH,
      width: EXPLOSION_WIDTH,
      src: explosionImg,
      srcWidth: SRC_EXPLOSION_WIDTH,
      srcHeight: SRC_EXPLOSION_WIDTH,
      frame: 0,
      frameLocations: EXPLOSION_LOCATIONS,
    });

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
      this.eventEmitter.asteroidExploded(this.toDTO(), laserBeamId);
      this.isDead = true;
      this.explosionIndex = 0;
    }
  }

  hit(laserBeamId: string) {
    if (this.radius < MIN_ASTEROID_HEIGHT) {
      this.explode(laserBeamId);
    } else {
      // split asteroid into 2 asteroids half the original size, 180 deg apart
      const deg = this.getHeading();
      const nextPos1 = this.getNextPosition(Math.floor(this.radius / 2));
      const nextPos2 = this.getNextPosition(Math.floor(this.radius / 2), deg + 180);
      const asteroid1 = new Asteroid({
        ...this,
        speed: 1,
        width: this.radius,
        height: this.radius,
        id: uuidV4(),
        x: nextPos1[0],
        y: nextPos1[1]
      });
      const asteroid2 = new Asteroid({
        ...this,
        speed: 1,
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
    return this.asteroidImg.loaded && this.explosionImg.loaded;
  }

  private drawExplosion(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    this.explosionImg.frame = this.getThrottledExplosionIndex()
    this.explosionImg.draw(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);

    this.explosionIndex++;

    if (this.getThrottledExplosionIndex() >= EXPLOSION_LOCATIONS.length) {
      this.onFinishedExploding(this);
    }
  }

  private getThrottledExplosionIndex() {
    return Math.floor(this.explosionIndex / 2);
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    if (!this.isLoaded()) {
      console.error("This image has not loaded yet");
      return;
    }

    if (this.isDead && this.getThrottledExplosionIndex() < EXPLOSION_LOCATIONS.length) {
      this.drawExplosion(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);
    } else if (!this.isDead) {
      this.asteroidImg.draw(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);
    }
  }

  public update<T extends GameObjectDTO>(dto: T): void {
    const {x, y, speed, deg, height, width} = dto;
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
    this.asteroidImg.update(dto);
    this.explosionImg.update({...dto, height: EXPLOSION_WIDTH, width: EXPLOSION_WIDTH});
    this.sections = this.getCurrentSections();
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
