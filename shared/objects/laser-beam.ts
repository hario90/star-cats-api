import { GameObjectType, LaserBeamDTO } from "../types";
import { GameObject } from "./game-object";

export class LaserBeam extends GameObject {
    constructor(props: LaserBeamDTO) {
        super({...props, type: GameObjectType.LaserBeam});
    }
}