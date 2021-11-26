import { Socket } from "socket.io-client";
import { timeout } from "../util";
import { drawStats } from "../objects/stats";
import { GameObjectManager } from "./game-object-manager";
import { SocketEventEmitter } from "./socket-event-emitter";

export class Renderer {
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null;
  private halfCanvasWidth: number = 0;
  private halfCanvasHeight: number = 0;
  private gameObjects: GameObjectManager;
  private eventEmitter: SocketEventEmitter;

  constructor(appEl: HTMLDivElement, socket: Socket, nickName: string, x: number, y: number) {
    this.eventEmitter = new SocketEventEmitter(socket);
    this.gameObjects = new GameObjectManager(this.eventEmitter, nickName, x, y, socket);

    this.setHeightWidth();
    appEl.appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("no context");
    }

    window.addEventListener("resize", this.setHeightWidth);

    this.draw = this.draw.bind(this);
    this.animate = this.animate.bind(this);
    this.moveAndDraw = this.moveAndDraw.bind(this);
    this.setHeightWidth = this.setHeightWidth.bind(this);
  }

  setHeightWidth() {
    if (this.canvas) {
      this.canvas.height = document.body.clientHeight;
      this.canvas.width = document.body.clientWidth;
      this.halfCanvasWidth = Math.floor(this.canvas.width / 2);
      this.halfCanvasHeight = Math.floor(this.canvas.height / 2);
    } else {
      throw new Error("Canvas not defined!")
    }
  }

  async pollUntilReady() {
    while (this.gameObjects.notReadyToRender()) {
      await timeout(1000)
    }
    // don't show canvas until everything is loaded
    this.canvas.className = "visible";
    this.gameObjects.ship.registerKeydownHandler();
  }

  draw() {
    if (!this.context) {
      return;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const [x, y] = this.gameObjects.getObjectNextPositionAndEmit(this.gameObjects.ship);
    const shipX = x;
    const shipY = y;

    this.gameObjects.background.draw(this.context, shipX - this.halfCanvasWidth, shipY - this.halfCanvasHeight, this.canvas.width, this.canvas.height);
    this.gameObjects.alerts.draw(this.context, this.halfCanvasWidth, this.halfCanvasHeight);
    this.gameObjects.ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);

    for (const ship of this.gameObjects.ships.values()) {
      if (this.gameObjects.ship.id !== ship.id) {
        if (ship.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
          ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
        }
      }
    }
    for (const asteroid of this.gameObjects.asteroids.values()) {
      if (asteroid.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
        asteroid.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }
    for (const laserBeam of this.gameObjects.laserBeams.values()) {
      this.gameObjects.getObjectNextPositionAndEmit(laserBeam);
      if (laserBeam.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
        laserBeam.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }
    for (const gem of this.gameObjects.gems.values()) {
      if (gem.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
        gem.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }

    drawStats(this.context, this.halfCanvasWidth, {
      points: this.gameObjects.ship.points,
      lives: this.gameObjects.ship.numLives
    })
  }

  animate() {
    if (!this.context) {
      return;
    }
    window.requestAnimationFrame(this.moveAndDraw)
  }

  async moveAndDraw() {
    this.draw();
    window.requestAnimationFrame(this.moveAndDraw);
  }
}