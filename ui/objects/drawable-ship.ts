import { BattleShipFrame } from "../types";
import explosionImg from "../../assets/explosion.png";
import shipImg from "../../assets/ship.png";
import { getRelativePosition, getSectionsMap } from "../util";
import { Drawable } from "./drawable";
import { halfShipHeight, halfShipWidth } from "../../shared/constants";
import { GameObjectDTO, GameObjectType, ShipDTO } from "../../shared/types";
import { COL_THICKNESS, hasCollided, ROW_THICKNESS } from "../../shared/util";
import { DrawableAsteroid } from "./drawable-asteroid";
import { GameObject } from "../../shared/objects/game-object";
import { DrawableLaserBeam } from "./drawable-laser-beam";
import { EXPLOSION_LOCATIONS, EXPLOSION_WIDTH, HALF_EXPLOSION_WIDTH, RAD } from "../constants";
import { Section } from "./section";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject, isDrawableAsteroid, isDrawableGem, isDrawableLaserBeam, isDrawableShip } from "../game-engine/types";

const frameToLocation = new Map([
  [BattleShipFrame.NORMAL, [0, 0]],
  [BattleShipFrame.THRUST_LOW, [2 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED_LOW, [4 * halfShipWidth, 0]],
  [BattleShipFrame.THRUST_MED, [0, 2 * halfShipHeight]],
  [BattleShipFrame.THRUST_HI, [2 * halfShipWidth, 2 * halfShipHeight]]
]);

const speedToFrame = new Map([
  [1, BattleShipFrame.NORMAL],
  [2, BattleShipFrame.THRUST_LOW],
  [3, BattleShipFrame.THRUST_MED_LOW],
  [4, BattleShipFrame.THRUST_MED],
  [5, BattleShipFrame.THRUST_HI],
]);

const DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS = 90;
export const MAX_SPEED = 5;

export interface DrawableShipProps {
  id: string;
  name: string;
  deg?: number;
  speed?: number;
  x: number;
  y: number;
  onFinishedExploding: (name: string) => void;
  eventEmitter: SocketEventEmitter;
}

const MAX_NUM_LIVES = 5;
const SHOW_SHIP_INTERVAL = 14;
const HIDE_SHIP_INTERVAL = 10;
const MAX_BLINKS = 6;
const MAX_HEALTH_POINTS = 10;
export class DrawableShip extends Drawable {
  private shipImg: HTMLImageElement;
  private explosionImg: HTMLImageElement;
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

  constructor({id, x, y, deg, speed, name, onFinishedExploding, eventEmitter}: DrawableShipProps) {
    super({
      x,
      y,
      deg: deg ?? 0,
      id,
      type: GameObjectType.Ship,
      speed: speed ?? 1,
      height: 2 * halfShipHeight,
      width: 2 * halfShipWidth,
      eventEmitter,
    });
    this.name = name;

    this.shipImg = new Image();
    this.shipImg.src = shipImg;
    this.shipImg.onload = () => this.loaded = true;
    this.onFinishedExploding = onFinishedExploding;

    this.explosionImg = new Image();
    this.explosionImg.src = explosionImg;
    this.explosionImg.onload = () => this.explosionLoaded = true;

    this.sections = getSectionsMap(this);

    this.getPosition = this.getPosition.bind(this);
    this.explode = this.explode.bind(this);
    this.isLoaded = this.isLoaded.bind(this);
    this.checkForSectionsChange = this.checkForSectionsChange.bind(this);
  }

  getCurrentSections() {
    const currSections = new Map<string, Section>();
    const row = Math.floor(this.y / ROW_THICKNESS);
    const col = Math.floor(this.x / COL_THICKNESS);

    // what section is the top point in?
    const topPointRow = Math.floor(this.minY / ROW_THICKNESS);
    const topSection = new Section(topPointRow, col);
    currSections.set(topSection.key, topSection);

    const rightPointCol = Math.floor(this.maxX / COL_THICKNESS);
    const rightSection = new Section(row, rightPointCol);
    currSections.set(rightSection.key, rightSection);

    const bottomPointRow = Math.floor(this.maxY / ROW_THICKNESS);
    const bottomSection = new Section(bottomPointRow, col);
    currSections.set(bottomSection.key, bottomSection);

    const leftPointCol = Math.floor(this.minX / COL_THICKNESS);
    const leftSection = new Section(row, leftPointCol);
    currSections.set(leftSection.key, leftSection);

    return currSections;
  }

  checkForSectionsChange(sectionToShips: Map<string, Set<DrawableShip>>) {
    const currSections = this.getCurrentSections();
    for (const [key] of this.sections) {
      if (!currSections.has(key)) {
        const shipsInSection = sectionToShips.get(key);
        if (shipsInSection) {
          shipsInSection.delete(this);
        }
      }
    }

    this.sections = currSections;

    if (this.sections.size > 4) {
      throw new Error("Too many sections")
    }
  }

  // First arg is the ship representing this object
  // Second arg are all the objects
  public update<T extends GameObjectDTO>(ship: T): void {
    this.x = ship.x ?? this.x;
    this.y = ship.y ?? this.y;
    this.deg = ship.deg || 0;
    this.speed = ship.speed || 1;
    this.sections = this.getCurrentSections();
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

  private drawExplosion(context: CanvasRenderingContext2D) {
    const location = EXPLOSION_LOCATIONS[Math.floor(this.explosionIndex / 2)];
    context.drawImage(this.explosionImg, location[0], location[1], EXPLOSION_WIDTH, EXPLOSION_WIDTH, 0 - HALF_EXPLOSION_WIDTH, 0-HALF_EXPLOSION_WIDTH, EXPLOSION_WIDTH, EXPLOSION_WIDTH);
    this.explosionIndex++;

    if (this.explosionIndex >= EXPLOSION_LOCATIONS.length) {
      this.onFinishedExploding(this.name);
      this.startComingBackToLifeAnimation();
    }
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
    return this.loaded && this.explosionLoaded;
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number,
    halfCanvasWidth: number, halfCanvasHeight: number): void {
    if (!this.loaded) {
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

    if (this.isExploding) {
      this.drawExplosion(context);

    } else if (!this.isDead || this.isComingBackToLife) {
      context.rotate(this.deg * RAD);
      const frame = speedToFrame.get(this.speed) || BattleShipFrame.NORMAL;
      const srcLocation = frameToLocation.get(frame);
      if (!srcLocation) {
        throw new Error(`Could not find source image for the frame: ${frame}`);
      } else if (srcLocation.length < 2) {
        throw new Error(`Something is wrong with the frameToLocation map`);
      }

      if (!this.isDead || (this.isComingBackToLife && this.showShip)) {
        context.drawImage(this.shipImg, srcLocation[0], srcLocation[1], 2 * halfShipWidth, 2 * halfShipHeight, 0 - halfShipWidth, 0 - halfShipHeight, 2 * halfShipWidth, 2 * halfShipHeight);
        context.beginPath()
        context.arc(0, 0, this.radius, 0, Math.PI * 2, false)
        context.strokeStyle = "yellow"
        context.stroke()
        context.closePath()
      }

      if (this.isComingBackToLife) {
        this.handleComingBackToLifeAnimation()
      }
    }

    context.restore();
  }
}
