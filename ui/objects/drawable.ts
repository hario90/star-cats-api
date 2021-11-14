import { Socket } from "socket.io-client";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../shared/constants";
import { GameObject, GameObjectDTO } from "../../shared/objects/game-object";
import { DrawableAsteroid } from "./drawable-asteroid";
import { RAD } from "./drawable-ship";

export abstract class Drawable extends GameObject {
    public loaded: boolean = false;
    // todo why are these here?
    public userId: string | undefined = undefined;
    public isDead: boolean | undefined = false;

    constructor(props: GameObjectDTO) {
        super(props);
    }

    abstract update<T extends GameObject>(ship: T, sectionToAsteroids: Map<string, DrawableAsteroid[]>, socket: Socket): void;

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



  abstract draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;

  // Pass in speed if we want a different hypotenuse
  getNextPosition(speed?: number): [number, number] {
    const [x, y] = this.getPosition();
    speed = speed ?? this.getSpeed();
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

  isInFrame(halfCanvasWidth: number, halfCanvasHeight: number): boolean {
    const [x, y] = this.getPosition();
    const minX = x - halfCanvasWidth;
    const maxX = x + halfCanvasWidth;
    const minY = y - halfCanvasHeight;
    const maxY = y + halfCanvasHeight;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
}