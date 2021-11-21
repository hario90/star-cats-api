import { GameObjectDTO, GameObjectType, IGameObject, ISection } from "../types";
import { Coordinate, getSectionKey } from "../util";

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
        this.radius = Math.floor(this.width / 2);
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

    // https://github.com/Microsoft/TypeScript/issues/16858
    // capture the getters this way
    toJSON() {
        const proto = Object.getPrototypeOf(this);
        const jsonObj: any = Object.assign({}, this);

        Object.entries(Object.getOwnPropertyDescriptors(proto))
          .filter(([key, descriptor]) => typeof descriptor.get === 'function')
          .map(([key, descriptor]) => {
            if (descriptor && key[0] !== '_') {
              try {
                const val = (this as any)[key];
                jsonObj[key] = val;
              } catch (error) {
                console.error(`Error calling getter ${key}`, error);
              }
            }
          });

        return {
          ...jsonObj,
          minX: this.minX,
          minY: this.minY,
          maxX: this.maxX,
          maxY: this.maxY,
          radius: this.radius
        };
    }
}