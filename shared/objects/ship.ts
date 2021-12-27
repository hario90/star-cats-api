import { halfShipHeight, halfShipWidth } from "../constants";
import { GameObjectType, ShipDTO } from "../types";
import { GameObject } from "./game-object";

const MAX_HEALTH_POINTS = 10;
const MAX_NUM_LIVES = 5;

export class Ship extends GameObject {
    public name: string;
    public points: number;
    public healthPoints: number;
    public lives: number;
    public targetId?: string;
    public shootDeg?: number;

    constructor({
        id,
        x,
        y,
        healthPoints,
        lives,
        shootDeg,
        deg = 0,
        speed = 1,
        height = 2 * halfShipHeight,
        width = 2 * halfShipWidth,
        name,
        points,
        userControlled,
        targetId,
    }: ShipDTO) {
        super({
            id,
            x,
            y,
            deg,
            speed,
            height,
            width,
            type: GameObjectType.Ship,
            userControlled,
        });
        this.name = name || "Unnamed Vigilante";
        this.points = points ?? 0;
        this.healthPoints = healthPoints ?? 0;
        this.lives = lives ?? MAX_NUM_LIVES;
        this.healthPoints = healthPoints ?? MAX_HEALTH_POINTS;
        this.targetId = targetId;
        this.shootDeg = shootDeg;
    }

    getHeading(): number {
        return this.deg - 90;
    }

    reduceHealthPoints(reduceBy: number) {
        this.healthPoints -= reduceBy;
        if (this.healthPoints <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.healthPoints = MAX_HEALTH_POINTS;
            }
        }
    }

    public toDTO(): ShipDTO {
        return {
            x: this.x,
            y: this.y,
            height: this.height,
            width: this.width,
            name: this.name,
            id: this.id,
            points: this.points,
            deg: this.deg,
            shootDeg: this.shootDeg,
            speed: this.speed,
            type: this.type,
            healthPoints: this.healthPoints,
            lives: this.lives,
            userControlled: this.userControlled,
            targetId: this.targetId,
        };
    }
}
