import { getRelativePosition, getSectionsMap } from "../util";
import { GemDTO, GameObjectDTO } from "../../shared/types";
import { DrawableShip } from "./drawable-ship";
import { DrawableLaserBeam } from "./drawable-laser-beam";
import { Drawable } from "./drawable";
import { DrawableAsteroid } from "./drawable-asteroid";
import { SocketEventEmitter } from "../game-engine/socket-event-emitter";
import { DrawableObject, isDrawableAsteroid, isDrawableLaserBeam, isDrawableShip, isDrawableGem } from "../game-engine/types";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export interface DrawableGemProps extends GemDTO {
    eventEmitter: SocketEventEmitter;
}

export class DrawableGem extends Drawable {
  private readonly color: string;
  public readonly points: number;

  constructor(gem: DrawableGemProps) {
    super(gem);
    this.points = gem.points;
    this.color = "yellow";
    this.sections = getSectionsMap(this);
    this.loaded = true;
    this.width = 10;
    this.height = 14;
  }

  whenHitBy(object: DrawableObject): void {
    // the ship that hits it is in charge of emitting an event
  }

  draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number) {
    if (!this.loaded) {
      console.error("This image has not loaded yet");
      return;
    }

    context.save();
    const {x, y} = getRelativePosition(halfCanvasWidth, halfCanvasHeight, shipX, shipY, this.x, this.y);
    if (!this.isDead) {
        context.beginPath();
        context.moveTo(x, y + this.radius);
        context.lineTo(x + this.radius, y);
        context.lineTo(x, y - this.radius);
        context.lineTo(x - this.radius, y);
        context.closePath();
        context.fillStyle = this.color;
        context.fill();
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

  public toDTO(): GemDTO {
      return {
        points: this.points,
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
