import { AsteroidDTO, GameObjectType, GemDTO } from "../types";
import { GameObject } from "./game-object";

export class Gem extends GameObject {
    public readonly points = 1;
    constructor(props: AsteroidDTO) {
        super({...props, type: GameObjectType.Gem});
    }

    isLoaded() {
        return true;
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