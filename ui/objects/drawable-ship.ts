import { v4 as uuid } from "uuid";
import { BattleShipFrame } from "../types";
import explosionImg from "../../assets/explosion.png";
import allAssets from "../../assets/sheet.png";
import * as assetsXML from "../../assets/sheet.xml";
import shipImg from "../../assets/ship.png";
import { getRelativePosition, getSectionsMap } from "../util";
import { Drawable } from "./drawable";
import {
    BOARD_HEIGHT,
    BOARD_WIDTH,
    halfShipHeight,
    halfShipWidth,
} from "../../shared/constants";
import {
    GameObjectDTO,
    GameObjectType,
    LaserBeamDTO,
    PlayerShipColor,
    ShipColor,
    ShipDTO,
    ShipModelNum,
} from "../../shared/types";
import { Coordinate } from "../../shared/util";
import { EXPLOSION_LOCATIONS, SRC_EXPLOSION_WIDTH } from "../constants";
import { ImageComponent } from "../component";
import { Canvas } from "../game-engine/canvas";
import { getImageComponentFromXML } from "./xml-drawing-utils";

const frameToLocation = new Map([
    [BattleShipFrame.NORMAL, [0, 0]],
    [BattleShipFrame.THRUST_LOW, [2 * halfShipWidth, 0]],
    [BattleShipFrame.THRUST_MED_LOW, [4 * halfShipWidth, 0]],
    [BattleShipFrame.THRUST_MED, [0, 2 * halfShipHeight]],
    [BattleShipFrame.THRUST_HI, [2 * halfShipWidth, 2 * halfShipHeight]],
]);

const shipFrameLocations: Coordinate[] = [
    [0, 0],
    [2 * halfShipWidth, 0],
    [4 * halfShipWidth, 0],
    [0, 2 * halfShipHeight],
    [2 * halfShipWidth, 2 * halfShipHeight],
];

const speedToFrame = new Map([
    [1, BattleShipFrame.NORMAL],
    [2, BattleShipFrame.THRUST_LOW],
    [3, BattleShipFrame.THRUST_MED_LOW],
    [4, BattleShipFrame.THRUST_MED],
    [5, BattleShipFrame.THRUST_HI],
]);

const DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS = 90;
const MAX_HIT_ANIMATION_DURATION = 10;
export const MAX_SPEED = 5;

export interface DrawableShipProps extends ShipDTO {
    onFinishedExploding: (name: string) => void;
    onShoot: (laserBeam: LaserBeamDTO) => void;
    isMainShip?: boolean;
    canvas: Canvas;
}

const MAX_NUM_LIVES = 5;
const SHOW_SHIP_INTERVAL = 14;
const HIDE_SHIP_INTERVAL = 10;
const MAX_BLINKS = 6;
const MAX_HEALTH_POINTS = 10;

export const EXPLOSION_WIDTH = 96;
export class DrawableShip extends Drawable {
    private shipImg: ImageComponent;
    private explosionImg: ImageComponent;
    private explosionIndex = -1; // if not exploding. otherwise 0 to 13.
    private onFinishedExploding: (name: string) => void;
    private onShoot: (laserBeam: LaserBeamDTO) => void;
    private hit = 0;
    public currentKeysDown: Set<string> = new Set();
    public isMainShip = false;
    public targetId?: string;
    public shootDeg = 0;

    public name: string;
    public lives: number = MAX_NUM_LIVES;
    public points = 0;
    public healthPoints = MAX_HEALTH_POINTS;
    private blinkCount = MAX_BLINKS;
    private blinkIntervalCount = 0;
    public isComingBackToLife = false;
    private showShip = true;
    public isDead = false;
    public speed: number = 1;
    public radius = 0;
    public color: ShipColor;
    public modelNum: ShipModelNum;
    private changeFrameOnSpeed = false;

    constructor(props: DrawableShipProps) {
        super(props);
        this.shootDeg = props.deg;
        this.targetId = props.targetId;
        this.isMainShip = props.isMainShip ?? false;
        this.speed = Math.max(props.speed ?? 1, 1);
        this.name = props.name ?? "Unnamed Vigilante";
        this.points = props.points ?? 0;
        this.lives = props.lives || MAX_NUM_LIVES;
        this.healthPoints = props.healthPoints || MAX_HEALTH_POINTS;
        this.color = props.color;
        this.modelNum = props.modelNum;
        const color = `${props.color[0].toUpperCase()}${props.color.substring(
            1
        )}`;
        const objectName = this.userControlled
            ? `playerShip${props.modelNum}_${props.color}.png`
            : `enemy${color}${props.modelNum}.png`;
        const imageComponent = getImageComponentFromXML(
            allAssets,
            assetsXML,
            objectName,
            props
        );

        if (imageComponent) {
            this.shipImg = imageComponent;
        } else {
            this.shipImg = new ImageComponent({
                ...props,
                src: shipImg,
                srcWidth: 2 * halfShipWidth,
                srcHeight: 2 * halfShipHeight,
                frame: 0,
                frameLocations: shipFrameLocations,
            });
        }

        this.explosionImg = new ImageComponent({
            ...props,
            height: EXPLOSION_WIDTH,
            width: EXPLOSION_WIDTH,
            src: explosionImg,
            srcWidth: SRC_EXPLOSION_WIDTH,
            srcHeight: SRC_EXPLOSION_WIDTH,
            frame: 0,
            frameLocations: EXPLOSION_LOCATIONS,
        });

        this.onFinishedExploding = props.onFinishedExploding;
        this.onShoot = props.onShoot;
        this.sections = getSectionsMap(this);

        this.getPosition = this.getPosition.bind(this);
        this.explode = this.explode.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
    }

    // First arg is the ship representing this object
    // Second arg are all the objects
    public update = <T extends GameObjectDTO>(ship: T): void => {
        this.x = ship.x ?? this.x;
        this.y = ship.y ?? this.y;
        this.deg = ship.deg || 0;
        this.speed = ship.speed || 1;
        this.sections = this.getCurrentSections();
        this.shipImg.update(ship);
        this.explosionImg.update({
            ...ship,
            width: EXPLOSION_WIDTH,
            height: EXPLOSION_WIDTH,
        });
    };

    public toDTO = (): ShipDTO => {
        return {
            x: this.x,
            y: this.y,
            height: this.height,
            width: this.width,
            name: this.name,
            id: this.id,
            points: this.points,
            deg: this.deg,
            speed: this.speed,
            type: this.type,
            lives: this.lives,
            healthPoints: this.healthPoints,
            userControlled: this.userControlled,
            targetId: this.targetId,
            shootDeg: this.shootDeg,
            color: this.color,
            modelNum: this.modelNum,
        };
    };

    getWidth = (): number => {
        return 2 * halfShipWidth;
    };

    getHeight = (): number => {
        return 2 * halfShipHeight;
    };

    getHeading = () => {
        return this.deg - DEGREE_OF_SHIP_NOSE_FROM_POS_X_AXIS;
    };

    explode = () => {
        this.isDead = true;
        this.explosionIndex = 0;
    };

    public onHit() {
        this.hit = MAX_HIT_ANIMATION_DURATION;
    }

    public shoot() {
        const [x, y] = this.getNextPosition(
            Math.round(this.height / 2),
            this.shootDeg
        );
        const laserBeam: LaserBeamDTO = {
            x,
            y,
            type: GameObjectType.LaserBeam,
            // deg represents the angle going clockwise down from the positive x-axis
            deg: this.shootDeg,
            speed: 20,
            height: 30,
            width: 10,
            id: uuid(),
            fromShipId: this.id,
            color: this.color,
            userControlled: false,
        };
        this.onShoot(laserBeam);
    }

    get laserColor(): string {
        if (!this.color) {
            return "#03fcdf";
        }

        switch (this.color) {
            case PlayerShipColor.Red:
                return "red";
            case PlayerShipColor.Green:
                return "green";
            case PlayerShipColor.Blue:
                return "blue";
            case PlayerShipColor.Orange:
                return "orange";
            default:
                return "#03fcdf";
        }
    }

    get isExploding() {
        const explosionIndex = this.getThrottledExplosionIndex();
        return (
            explosionIndex > -1 && explosionIndex < EXPLOSION_LOCATIONS.length
        );
    }

    private drawExplosion = (
        context: CanvasRenderingContext2D,
        shipX: number,
        shipY: number,
        halfCanvasWidth: number,
        halfCanvasHeight: number
    ) => {
        this.explosionImg.frame = this.getThrottledExplosionIndex();
        this.explosionImg.draw(context, shipX, shipY);
        this.explosionIndex++;

        if (this.getThrottledExplosionIndex() >= EXPLOSION_LOCATIONS.length) {
            this.onFinishedExploding(this.name);
            this.startComingBackToLifeAnimation();
        }
    };

    private getThrottledExplosionIndex = () => {
        return Math.floor(this.explosionIndex / 2);
    };

    private comeToLife = () => {
        this.isComingBackToLife = false;
        this.isDead = false;
        this.showShip = true;
        this.blinkIntervalCount = HIDE_SHIP_INTERVAL;
        this.blinkCount = MAX_BLINKS;
    };

    private startComingBackToLifeAnimation = () => {
        if (this.lives > 0) {
            this.isComingBackToLife = true;
            this.showShip = false;
            this.blinkIntervalCount = HIDE_SHIP_INTERVAL;
        }

        this.x = Math.random() * BOARD_WIDTH;
        this.y = Math.random() * BOARD_HEIGHT;
        if (this.userControlled) {
            this.speed = 1;
        }
    };

    private handleComingBackToLifeAnimation = () => {
        this.blinkIntervalCount--;

        if (this.blinkIntervalCount <= 0) {
            this.blinkCount--;
            this.showShip = !this.showShip;
            this.blinkIntervalCount = this.showShip
                ? SHOW_SHIP_INTERVAL
                : HIDE_SHIP_INTERVAL;
            if (this.blinkCount <= 0) {
                this.comeToLife();
            }
        }
    };

    isLoaded = () => {
        return this.shipImg.loaded && this.explosionImg.loaded;
    };

    draw = (
        context: CanvasRenderingContext2D,
        shipX: number,
        shipY: number
    ): void => {
        if (!this.isLoaded()) {
            console.error("Image has not loaded yet");
            return;
        }

        const halfCanvasWidth = this.canvas.halfWidth;
        const halfCanvasHeight = this.canvas.halfHeight;

        context.save();
        // always render ship at center of screen
        const { x, y } = getRelativePosition(
            halfCanvasWidth,
            halfCanvasHeight,
            shipX,
            shipY,
            this.x,
            this.y
        );
        context.translate(x, y);
        context.font = "14px ken";
        context.fillStyle = "white";

        if (!this.isDead) {
            context.fillText(this.name, halfShipWidth, 0);
        }

        context.restore();

        if (this.isExploding) {
            this.drawExplosion(
                context,
                shipX,
                shipY,
                halfCanvasWidth,
                halfCanvasHeight
            );
        } else if (!this.isDead || this.isComingBackToLife) {
            const frame = this.changeFrameOnSpeed
                ? speedToFrame.get(this.speed) ?? BattleShipFrame.NORMAL
                : BattleShipFrame.NORMAL;
            const srcLocation = frameToLocation.get(frame);
            if (!srcLocation) {
                throw new Error(
                    `Could not find source image for the frame: ${frame}`
                );
            } else if (srcLocation.length < 2) {
                throw new Error(
                    `Something is wrong with the frameToLocation map`
                );
            }

            if (!this.isDead || (this.isComingBackToLife && this.showShip)) {
                if (this.currentKeysDown.has("Shift")) {
                    context.beginPath();
                    context.strokeStyle = "#33fff8";
                    context.arc(x, y, this.width, 0, 2 * Math.PI);
                    context.stroke();
                    context.beginPath();
                    context.setLineDash([5, 5, 5, 5, 5, 5]);
                    context.moveTo(x, y);
                    const lineEndPoint = this.getNextPosition(
                        100,
                        this.shootDeg
                    );
                    const relativeLineEndPoint = getRelativePosition(
                        halfCanvasWidth,
                        halfCanvasHeight,
                        shipX,
                        shipY,
                        lineEndPoint[0],
                        lineEndPoint[1]
                    );
                    context.lineTo(
                        relativeLineEndPoint.x,
                        relativeLineEndPoint.y
                    );
                    context.stroke();
                    context.setLineDash([]);
                }

                if (this.changeFrameOnSpeed) {
                    this.shipImg.frame = this.speed - 1;
                }

                if (this.hit > 0) {
                    this.shipImg.drawTinted(context, shipX, shipY, "red");
                    this.hit--;
                } else if (!this.userControlled) {
                    this.shipImg.drawTinted(context, shipX, shipY, "green");
                } else {
                    this.shipImg.draw(context, shipX, shipY);
                }
            }

            if (this.isComingBackToLife) {
                this.handleComingBackToLifeAnimation();
            }
        }

        context.restore();
    };
}
