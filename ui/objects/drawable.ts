import { GameObject } from "../../shared/objects/game-object";
import { GameObjectDTO } from "../../shared/types";
import { ROW_THICKNESS, COL_THICKNESS, NUM_ROWS, NUM_COLUMNS } from "../../shared/util";
import { Canvas } from "../game-engine/canvas";
import { Section } from "./section";

export interface DrawableProps extends GameObjectDTO {
  canvas: Canvas;
}

export abstract class Drawable extends GameObject {
    public loaded: boolean = false;
    // todo why are these here?
    public userId: string | undefined = undefined;
    public isDead: boolean | undefined = false;
    public sections: Map<string, Section> = new Map();
    protected canvas: Canvas;

    constructor(props: DrawableProps) {
        super(props);
        this.canvas = props.canvas;
    }

    abstract update<T extends GameObject>(ship: T): void;

    abstract toDTO(): GameObjectDTO;

    getId(): string {
        return this.id;
    }

    setId(id: string): void {
        this.id = id;
    }

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

    getRadius(): number {
        return Math.round(this.width / 2);
    }

  abstract draw(context: CanvasRenderingContext2D, shipX: number, shipY: number): void;

  isInFrame(): boolean {
    const halfCanvasWidth = this.canvas.halfWidth;
    const halfCanvasHeight = this.canvas.halfHeight;
    const [x, y] = this.getPosition();
    const minX = x - halfCanvasWidth;
    const maxX = x + halfCanvasWidth;
    const minY = y - halfCanvasHeight;
    const maxY = y + halfCanvasHeight;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  getCurrentSections() {
    const currSections = new Map<string, Section>();
    const row = Math.floor(this.y / ROW_THICKNESS);
    const col = Math.floor(this.x / COL_THICKNESS);

    // what section is the top point in?
    const topPointRow = Math.floor(this.minY / ROW_THICKNESS);
    if (topPointRow < NUM_ROWS && topPointRow >= 0) {
      const topSection = new Section(topPointRow, col);
      currSections.set(topSection.key, topSection);
    }

    const rightPointCol = Math.floor(this.maxX / COL_THICKNESS);
    if (rightPointCol < NUM_COLUMNS && rightPointCol >= 0) {
      const rightSection = new Section(row, rightPointCol);
      currSections.set(rightSection.key, rightSection);
    }

    const bottomPointRow = Math.floor(this.maxY / ROW_THICKNESS);
    if (bottomPointRow < NUM_ROWS && bottomPointRow >= 0) {
      const bottomSection = new Section(bottomPointRow, col);
      currSections.set(bottomSection.key, bottomSection);
    }

    const leftPointCol = Math.floor(this.minX / COL_THICKNESS);
    if (leftPointCol < NUM_COLUMNS && leftPointCol >= 0) {
      const leftSection = new Section(row, leftPointCol);
      currSections.set(leftSection.key, leftSection);
    }

    return currSections;
  }
}