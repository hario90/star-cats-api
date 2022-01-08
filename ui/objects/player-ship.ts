import { getDegBetweenPoints } from "../../shared/util";
import { getRelativePosition, timeout } from "../util";
import { DrawableShip, DrawableShipProps } from "./drawable-ship";

export const halfShipWidth = 16;
export const halfShipHeight = 15;

const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";
const UP = "ArrowUp";
const DOWN = "ArrowDown";
const SPACE = " ";
const SHIFT = "Shift";
const DEGREE_INCREMENT = 10;
export const MAX_SPEED = 5;

// TODO decide on where to place each ship initially
export class PlayerShip extends DrawableShip {
    private slowDownAnimationOn = false;
    public readonly userControlled = true;
    public currentKeysDown: Set<string> = new Set();
    constructor(props: DrawableShipProps) {
        super({
            ...props,
            isMainShip: true,
        });
        this.getPosition = this.getPosition.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.shoot = this.shoot.bind(this);
    }

    registerKeydownHandler() {
        document.addEventListener("keydown", this.handleKeydown);
        document.addEventListener("keyup", this.handleKeyup);
        document.addEventListener("mousemove", this.handleMousemove);
        document.addEventListener("click", this.handleClick);
    }

    handleShipDied = () => {
        document.removeEventListener("keydown", this.handleKeydown);
        document.removeEventListener("keyup", this.handleKeyup);
        document.removeEventListener("mousemove", this.handleMousemove);
        document.removeEventListener("click", this.handleClick);
        this.isDead = true;
        this.speed = 0;
    };

    handleClick = (e: MouseEvent) => {
        e.preventDefault();
        if (!this.currentKeysDown.has(SHIFT)) {
            this.shootDeg = this.getHeading();
        }
        this.shoot();
    };

    handleMousemove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { x, y } = getRelativePosition(
            this.canvas.halfWidth,
            this.canvas.halfHeight,
            clientX,
            clientY,
            this.x,
            this.y
        );
        const nextDeg = getDegBetweenPoints([x, y], [this.x, this.y]);
        if (this.currentKeysDown.has(SHIFT)) {
            this.shootDeg = nextDeg;
        } else {
            this.deg = (nextDeg + 90) % 360;
            this.shootDeg = this.deg;
        }
    };

    async handleKeydown(e: KeyboardEvent) {
        this.currentKeysDown.add(e.key);
        switch (e.key) {
            case UP:
            case "w":
                e.preventDefault();
                if (this.speed < MAX_SPEED) {
                    this.speed = MAX_SPEED;
                }
                break;
            case DOWN:
            case "s":
                e.preventDefault();
                if (this.speed > 1) {
                    this.speed--;
                }
                break;
            case LEFT:
                e.preventDefault();
                const degToUpdate = this.currentKeysDown.has(SHIFT)
                    ? this.shootDeg
                    : this.deg;
                let nextDeg = degToUpdate - DEGREE_INCREMENT;
                if (nextDeg < 0) {
                    nextDeg += 360;
                }
                if (this.currentKeysDown.has(SHIFT)) {
                    this.shootDeg = nextDeg;
                } else {
                    this.deg = nextDeg;
                }

                break;
            case RIGHT:
                e.preventDefault();
                if (this.currentKeysDown.has(SHIFT)) {
                    this.shootDeg = (this.shootDeg + DEGREE_INCREMENT) % 360;
                } else {
                    this.deg = (this.deg + DEGREE_INCREMENT) % 360;
                }

                break;
            case SPACE:
                e.preventDefault();
                if (!this.currentKeysDown.has(SHIFT)) {
                    this.shootDeg = this.getHeading();
                }
                this.shoot();
                break;
        }
    }

    handleKeyup = (e: KeyboardEvent) => {
        this.currentKeysDown.delete(e.key);
    };
}
