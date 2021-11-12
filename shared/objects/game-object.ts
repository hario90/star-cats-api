import { GameObjectType, IGameObject, PositionInfoDTO } from "../types";

export interface GameObjectProps extends PositionInfoDTO {
    id: string;
    type: GameObjectType;
}

export abstract class GameObject implements IGameObject{
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

    constructor({id, type, x, y, deg, speed, height, width}: GameObjectProps) {
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

        return jsonObj;
    }
}