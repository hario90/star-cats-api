import { BOARD_HEIGHT, BOARD_WIDTH, halfShipWidth } from "../../shared/constants";
import { GameObjectType } from "../../shared/types";
import { IDrawable } from "../types";
import { RAD } from "./drawable-ship";

export abstract class Drawable implements IDrawable {
    public x: number = 0;
    public y: number = 0;
    public type: GameObjectType = GameObjectType.Unknown;
    public loaded: boolean = false;
    public speed: number = 0;
    public deg: number = 0;
    public height: number = 0;
    public width: number = 0;
    public id: string = "";
    public userId: string | undefined = undefined;
    public isDead: boolean | undefined = false;

    constructor(id: string) {
        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    setId(id: string): void {
        this.id = id;
    }

    getPosition(): number[] {
        return [this.x, this.y];
    }
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    getHeading(): number {
        return this.deg;
    }

    getSpeed(): number {
        return this.speed;
    }

    setSpeed(speed: number) {
        this.speed = speed;
    }

    getHeight(): number {
        return this.height;
    }

    getWidth(): number {
        return this.width;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    getUserId(): string | undefined {
        return this.userId;
    }

    getRadius(): number {
        return Math.round(this.width / 2);
    }

  get minX(): number {
    return this.x - (0.5 * this.width);
  }

  get minY(): number {
      return this.y - (0.5 * this.height);
  }

  get maxX(): number {
      return this.x + (0.5 * this.width);
  }

  get maxY(): number {
      return this.y + (0.5 * this.height);
  }

  abstract draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;

  getNextPosition(): [number, number] {
    const [x, y] = this.getPosition();
    const speed = this.getSpeed();
    let heading = this.getHeading();
    if (heading < 0) {
      heading = 360 + heading;
    }
    let deg = heading;
    const minX = this.getRadius();
    const maxX = BOARD_WIDTH - this.getWidth();
    const minY = this.getWidth();
    const maxY = BOARD_HEIGHT - this.getWidth();
    if (heading < 90) {
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.min(x + adjacent, maxX), Math.min(y + opposite, maxY)];
    } else if (heading === 90) {
      return [x, Math.min(y + speed, maxY)];
    } else if (heading < 180) {
      deg = 180 - heading;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.max(x - adjacent, minX), Math.min(y + opposite, maxY)];
    } else if (heading === 180) {
      return [Math.max(x - speed, minX), y];
    } else if (heading < 270) {
      deg = heading - 180;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.max(x - adjacent, minX), Math.max(y - opposite, minY)];
    } else if (heading === 270) {
      return [x, Math.max(y - speed, minY)];
    } else {
      deg = 360 - heading;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.min(x + adjacent, maxX), Math.max(y - opposite, minY)]
    }
  }
}