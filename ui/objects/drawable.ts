import { GameObjectType } from "../../shared/types";
import { IDrawable } from "../types";

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
}