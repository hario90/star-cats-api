import { BattleShipFrame } from "../types";
import explosionImg from "../../assets/explosion.png";
import shipImg from "../../assets/ship.png";
import { getRelativePosition, getSectionsMap } from "../util";
import { Drawable } from "./drawable";
import { halfShipHeight, halfShipWidth } from "../../shared/constants";
import { GameObjectDTO, GameObjectType, ShipDTO } from "../../shared/types";
import { COL_THICKNESS, Coordinate, ROW_THICKNESS } from "../../shared/util";
import { EXPLOSION_LOCATIONS, SRC_EXPLOSION_WIDTH, HALF_EXPLOSION_WIDTH, RAD } from "../constants";
import { Section } from "./section";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject, isDrawableAsteroid, isDrawableGem, isDrawableLaserBeam, isDrawableShip } from "../game-engine/types";
import { ImageComponent } from "../component";

const frameToLocation = new Map([
  [BattleShipFrame.NORMAL, [0, 0]],
  [BattleShipFrame.THRUST_LOW, [2 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED_LOW, [4 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED, [0, 2 * halfShipHeight]],
  [BattleShipFrame.THRUST_HI, [2 * halfShipWidth, 2 * halfShipHeight]]
]);

const shipFrameLocations: Coordinate[] = [
  [0, 0],
  [2 * halfShipWidth, 0],
  [4 * halfShipWidth, 0],
  [0, 2 * halfShipHeight],
  [2 * halfShipWidth, 2 * halfShipHeight]
];

const speedToFrame = new Map([
  [1, BattleShipFrame.NORMAL],
  [2, BattleShipFrame.THRUST_LOW],
  [3, BattleShipFrame.THRUST_MED_LOW],
  [4, BattleShipFrame.THRUST_MED],
  [5, BattleShipFrame.THRUST_HI],
]);

const DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS = 90;
export const MAX_SPEED = 5;

export interface DrawableShipProps extends ShipDTO {
  onFinishedExploding: (name: string) => void;
  eventEmitter: SocketEventEmitter;
}

const MAX_NUM_LIVES = 5;
const SHOW_SHIP_INTERVAL = 14;
const HIDE_SHIP_INTERVAL = 10;
const MAX_BLINKS = 6;
const MAX_HEALTH_POINTS = 10;

export const EXPLOSION_WIDTH = 96;
export class DrawableShip extends Drawable {
  private shipImg: ImageComponent;
  private explosionImg: ImageComponent;
  private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
  private explosionLoaded = false;
  private onFinishedExploding: (name: string) => void;

  public name: string;
  public numLives: number = MAX_NUM_LIVES;
  public points = 0;
  public healthPoints = MAX_HEALTH_POINTS;
  private blinkCount = MAX_BLINKS;
  private blinkIntervalCount = 0;
  public isComingBackToLife = false;
  private showShip = true;
  public isDead = false;
  public speed: number = 1;
  public radius = 0;

  constructor(props: DrawableShipProps) {
    super(props);
    this.speed = props.speed ?? 1;
    this.name = props.name ?? "Unnamed Vigilante";
    this.points = props.points ?? 0;
    this.shipImg = new ImageComponent({
      ...props,
      src: shipImg,
      srcWidth: 2 * halfShipWidth,
      srcHeight: 2 * halfShipHeight,
      frame: 0,
      frameLocations: shipFrameLocations,
    });
    this.explosionImg = new ImageComponent({
      ...props,
      height: EXPLOSION_WIDTH,
      width: EXPLOSION_WIDTH,
      src: explosionImg,
      srcWidth: SRC_EXPLOSION_WIDTH,
      srcHeight: SRC_EXPLOSION_WIDTH,
      frame: 0,
      frameLocations: EXPLOSION_LOCATIONS,
    })

    this.onFinishedExploding = props.onFinishedExploding;
    this.sections = getSectionsMap(this);

    this.getPosition = this.getPosition.bind(this);
    this.explode = this.explode.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
  }

  // First arg is the ship representing this object
  // Second arg are all the objects
  public update<T extends GameObjectDTO>(ship: T): void {
    this.x = ship.x ?? this.x;
    this.y = ship.y ?? this.y;
    this.deg = ship.deg || 0;
    this.speed = ship.speed || 1;
    this.sections = this.getCurrentSections();
    this.shipImg.update(ship);
    this.explosionImg.update({
      ...ship,
      width: EXPLOSION_WIDTH,
      height: EXPLOSION_WIDTH
    })
  }

  public toDTO(): ShipDTO {
    return {
      x: this.x,
      y: this.y,
      height: this.height,
      width: this.width,
      name: this.name,
      id: this.id,
      points: this.points,
      deg: this.deg,
      speed: this.speed,
      type: this.type,
    }
  }

  getWidth(): number {
    return 2 * halfShipWidth;
  }

  getHeight(): number {
    return 2 * halfShipHeight
  }

  getHeading() {
    return this.deg - DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS;
  }

  whenHitBy(object: DrawableObject): void {
    if (isDrawableAsteroid(object)) {
      this.explode();
    } else if (isDrawableLaserBeam(object)) {
      this.reduceHealthPoints();
    } else if (isDrawableShip(object)) {
      this.explode();
    } else if (isDrawableGem(object)) {
      this.points++;
      this.eventEmitter.shipPickedUpGem(this.id, object.id);
    }
  }

  reduceHealthPoints(): void {
    if (this.healthPoints > 0) {
      this.healthPoints--;
      this.eventEmitter.shipDamaged(this.id, this.healthPoints);
    }
  }

  explode(laserBeamId?: string) {
    this.eventEmitter.shipExploded(this.id, laserBeamId)
    this.isDead = true;
    this.explosionIndex = 0;
    this.numLives--;
  }

  get isExploding() {
    return this.explosionIndex > -1 && this.explosionIndex < EXPLOSION_LOCATIONS.length
  }

  private drawExplosion(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    this.explosionImg.frame = this.getThrottledExplosionIndex()
    this.explosionImg.draw(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight)
    this.explosionIndex++;
    console.log("explosionIndex", this.explosionIndex);

    if (this.getThrottledExplosionIndex() >= EXPLOSION_LOCATIONS.length) {
      console.log("hit")
      this.onFinishedExploding(this.name);
      this.startComingBackToLifeAnimation();
    }
  }

  private getThrottledExplosionIndex() {
    return Math.floor(this.explosionIndex / 2);
  }

  private comeToLife() {
    this.isComingBackToLife = false;
    this.isDead = false;
    this.showShip = true;
    this.blinkIntervalCount = HIDE_SHIP_INTERVAL;
    this.blinkCount = MAX_BLINKS;
  }

  private startComingBackToLifeAnimation() {
    if (this.numLives > 0) {
      this.isComingBackToLife = true;
      this.showShip = false;
      this.blinkIntervalCount = HIDE_SHIP_INTERVAL
    }

    this.x = 50;
    this.y = 50;
    this.speed = 1;
    this.radius = 0;
  }

  private handleComingBackToLifeAnimation() {
    this.blinkIntervalCount--;

    if (this.blinkIntervalCount <= 0) {
      this.blinkCount--;
      this.showShip = !this.showShip;
      this.blinkIntervalCount = this.showShip ? SHOW_SHIP_INTERVAL : HIDE_SHIP_INTERVAL;
      if (this.blinkCount <= 0) {
        this.comeToLife();
      }
    }
  }

  isLoaded() {
    return this.shipImg.loaded && this.explosionImg.loaded;
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number,
    halfCanvasWidth: number, halfCanvasHeight: number): void {
    if (!this.isLoaded()) {
      console.error("Image has not loaded yet");
      return;
    }

    context.save();
    // always render ship at center of screen
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    context.translate(x, y);
    context.font = "14px Arial";
    context.fillStyle = "white";

    if (!this.isDead) {
      context.fillText(this.name, halfShipWidth, 0);
    }

    context.restore();

    if (this.isExploding) {
      this.drawExplosion(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);

    } else if (!this.isDead || this.isComingBackToLife) {
      const frame = speedToFrame.get(this.speed) || BattleShipFrame.NORMAL;
      const srcLocation = frameToLocation.get(frame);
      if (!srcLocation) {
        throw new Error(`Could not find source image for the frame: ${frame}`);
      } else if (srcLocation.length < 2) {
        throw new Error(`Something is wrong with the frameToLocation map`);
      }

      if (!this.isDead || (this.isComingBackToLife && this.showShip)) {
        this.shipImg.frame = this.speed - 1;
        this.shipImg.draw(context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);
      }

      if (this.isComingBackToLife) {
        this.handleComingBackToLifeAnimation()
      }
    }

    context.restore();
  }
}
