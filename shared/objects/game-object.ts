import { BOARD_HEIGHT, BOARD_WIDTH, RAD } from "../constants";
import { GameObjectDTO, GameObjectType, IGameObject } from "../types";
import { Coordinate } from "../util";

export interface GameObjectProps extends GameObjectDTO {
  sections: Set<Coordinate>;
}
// each object keeps track of their sections as they are moved.
// to determine collision, first we check to see if they occupy the same section.
// if they do, check if they overlap.
export abstract class GameObject implements IGameObject {
    id: string;
    type: GameObjectType = GameObjectType.Unknown;
    getRadius(): number {
        return this.radius;
    }
    x: number;
    y: number;
    deg: number;
    speed: number;
    height: number;
    width: number;
    radius: number;

    constructor({id, type, x, y, deg, speed, height, width}: GameObjectDTO) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.deg = deg;
        this.speed = speed;
        this.height = height;
        this.width = width;
        this.radius = Math.round(this.width / 2);
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

    move(positionInfo: GameObjectDTO) {
      const { x, y, deg, speed } = positionInfo;
      this.x = x;
      this.y = y;
      this.deg = deg;
      this.speed = speed;
    }

    abstract toDTO(): GameObjectDTO;
    abstract getHeading(): number;

    getNextPosition(speed?: number, heading?: number): [number, number] {
        const x = this.x;
        const y = this.y;

        speed = speed ?? this.speed;
        heading = heading ?? this.getHeading();
        if (heading < 0) {
          heading = 360 + heading;
        }
        let deg = heading;
        const minX = this.getRadius();
        const maxX = BOARD_WIDTH - this.getRadius();
        const minY = this.getRadius();
        const maxY = BOARD_HEIGHT - this.getRadius();
        let nextX = x;
        let nextY = y;
        if (heading < 90) {
          const adjacent = Math.cos(deg * RAD) * speed;
          const opposite = Math.sin(deg * RAD) * speed;
          nextX = x + adjacent;
          nextY = y + opposite;
        } else if (heading === 90) {
          nextY = y + speed;
        } else if (heading < 180) {
          deg = 180 - heading;
          const adjacent = Math.cos(deg * RAD) * speed;
          const opposite = Math.sin(deg * RAD) * speed;
          nextX = x - adjacent;
          nextY = y + opposite;
        } else if (heading === 180) {
          nextX = x - speed;
        } else if (heading < 270) {
          deg = heading - 180;
          const adjacent = Math.cos(deg * RAD) * speed;
          const opposite = Math.sin(deg * RAD) * speed;
          nextX = x - adjacent;
          nextY = y - opposite;
        } else if (heading === 270) {
          nextY = y - speed;
        } else {
          deg = 360 - heading;
          const adjacent = Math.cos(deg * RAD) * speed;
          const opposite = Math.sin(deg * RAD) * speed;
          nextX = x + adjacent;
          nextY = y - opposite;
        }

        if (nextX < minX) {
          nextX = minX;
        } else if (nextX > maxX) {
          nextX = maxX;
        }
        if (nextY < minY) {
          nextY = minY;
        } else if (nextY > maxY) {
          nextY = maxY;
        }
        
        return [nextX, nextY];
    }
}