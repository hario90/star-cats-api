import { Socket } from "socket.io-client";
import { timeout } from "../util";
import { drawStats } from "../objects/stats";
import { GameObjectManager } from "./game-object-manager";
import { Canvas } from "./canvas";

export class Renderer {
    private canvas: Canvas;
    private gameObjects: GameObjectManager;

    constructor(appEl: HTMLDivElement, socket: Socket) {
        this.canvas = new Canvas(appEl);
        this.gameObjects = new GameObjectManager(socket, this.canvas);
        this.moveAndDraw = this.moveAndDraw.bind(this);
    }

    public pollUntilReady = async () => {
        while (this.gameObjects.notReadyToRender()) {
            await timeout(1000);
        }
        // don't show canvas until everything is loaded
        this.canvas.makeVisible();
        this.gameObjects.ship?.registerKeydownHandler();
    };

    private get context() {
        return this.canvas.context;
    }

    private draw = () => {
        if (!this.canvas.context || !this.gameObjects.ship) {
            throw new Error("context or playerShip is undefined");
        }

        const halfCanvasWidth = this.canvas.halfWidth;
        const halfCanvasHeight = this.canvas.halfHeight;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const [x, y] = this.gameObjects.getObjectNextPositionAndEmit(
            this.gameObjects.ship
        );
        const shipX = x;
        const shipY = y;

        this.gameObjects.background.draw(
            this.context,
            shipX - halfCanvasWidth,
            shipY - halfCanvasHeight,
            this.canvas.width,
            this.canvas.height
        );
        this.gameObjects.alerts.draw(this.context);

        for (const object of this.gameObjects.getAllObjects()) {
            if (!object.userControlled) {
                this.gameObjects.getObjectNextPositionAndEmit(object);
            }
            if (object.isLoaded() && object.isInFrame()) {
                object.draw(this.context, shipX, shipY);
            }
        }

        if (this.gameObjects.ship) {
            this.gameObjects.ships.get(this.gameObjects.ship.id);
            drawStats(this.context, halfCanvasWidth, {
                points: this.gameObjects.ship.points,
                lives: this.gameObjects.ship.lives,
                healthPoints: this.gameObjects.ship.healthPoints,
            });
        }
    };

    public animate = () => {
        if (!this.context) {
            return;
        }
        window.requestAnimationFrame(this.moveAndDraw);
    };

    public moveAndDraw = async () => {
        this.draw();
        window.requestAnimationFrame(this.moveAndDraw);
    };
}
