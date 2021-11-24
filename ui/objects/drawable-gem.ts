import { getRelativePosition } from "../util";
import { Socket } from "socket.io-client";
import { GemDTO, GameObjectDTO } from "../../shared/types";
import { DrawableShip } from "./drawable-ship";
import { getSectionsMap } from "../../shared/util";
import { DrawableLaserBeam } from "./drawable-laser-beam";
import { Drawable } from "./drawable";
import { DrawableAsteroid } from "./drawable-asteroid";

export const ASTEROID_HEIGHT = 32;
export const ASTEROID_WIDTH = 32;

export class DrawableGem extends Drawable {
  private readonly color: string;
  public readonly points: number;

  constructor(gem: GemDTO) {
    super(gem);
    this.points = gem.points;
    this.color = "yellow";
    this.sections = getSectionsMap(this);
    this.loaded = true;
    this.width = 10;
    this.height = 14;
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

  public update<T extends GameObjectDTO>({x, y, speed, deg, height, width}: T, sectionToAsteroids: Map<string, Set<DrawableAsteroid>>, sectionToShips: Map<string, Set<DrawableShip>>, sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>>, socket: Socket): void {
    this.speed = speed;
    this.deg = deg;
    this.height = height;
    this.width = width;
    this.x = x;
    this.y = y;
  }
}
