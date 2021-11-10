import { Drawable } from "./drawable";

export class DrawableLaserBeam extends Drawable {
    
    constructor(id: string, x: number, y: number, speed: number, deg: number, width = 5, height = 50) {
        super(id);
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.deg = deg;
        this.width = width;
        this.height = height;
    }

    draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void {
        throw new Error("Method not implemented.");
    }
}