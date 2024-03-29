import { AsteroidDTO, GameObjectType, GemDTO } from "../types";
import { GameObject } from "./game-object";

export class Gem extends GameObject {
    public readonly points: number;
    constructor(props: GemDTO) {
        super({ ...props, width: 30, height: 30, type: GameObjectType.Gem });
        this.points = props.points ?? 1;
    }

    getHeading(): number {
        return this.deg;
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
            type: this.type,
            userControlled: this.userControlled,
        };
    }
}
