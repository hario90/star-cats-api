import { GameObjectType, LaserBeamDTO } from "../types";
import { GameObject } from "./game-object";

export class LaserBeam extends GameObject {
    constructor(props: LaserBeamDTO) {
        super({...props, type: GameObjectType.LaserBeam});
    }

    public toDTO(): LaserBeamDTO {
        return {
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