import { IDrawable } from "../types";

export abstract class Drawable implements IDrawable {
    public x: number = 0;
    public y: number = 0;
    public loaded: boolean = false;
    public speed: number = 0;
    public deg: number = 0;
    public height: number = 0;
    public width: number = 0;
    public userId: string | undefined = undefined;

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
    abstract draw(context: CanvasRenderingContext2D, shipX: number, shipY: number, halfCanvasWidth: number, halfCanvasHeight: number): void;
}