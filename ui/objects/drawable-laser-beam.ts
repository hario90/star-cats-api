import { GameObjectProps } from "../../shared/objects/game-object";
import { Drawable } from "./drawable";

export interface DrawableLaserBeamProps extends GameObjectProps {
    color?: string
}

export class DrawableLaserBeam extends Drawable {

    constructor({color, ...rest}: DrawableLaserBeamProps) {
        super({...rest});
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void {
        throw new Error("Method not implemented.");
    }
}