import { Socket } from "socket.io-client";
import { AsteroidGenerator } from "./asteroid-generator";
import { Background } from "./objects/background";
import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import { halfShipWidth, MAX_SPEED, PlayerShip, RAD } from "./objects/player-ship";
import { Component } from "./types";
import { randomBoolean, timeout } from "./util";

export class Renderer {
  private components: Component[] = [];
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null;
  private ship: PlayerShip;
  private background: Background;
  private asteroidGenerator: AsteroidGenerator;
  private socket: Socket;

  constructor(appEl: HTMLDivElement, socket: Socket, name: string) {
    this.socket = socket;
    this.canvas.height = document.body.clientHeight;
    this.canvas.width = document.body.clientWidth;
    appEl.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("no context");
    }
    const canvasMidX =  Math.floor(this.canvas.width / 2);
    const canvasMidY = Math.floor(this.canvas.height / 2);
    this.ship = new PlayerShip(canvasMidX, canvasMidY, name);
    this.asteroidGenerator = new AsteroidGenerator();

    this.draw = this.draw.bind(this);
    this.animate = this.animate.bind(this);
    this.moveAndDraw = this.moveAndDraw.bind(this);
    this.getNextPosition = this.getNextPosition.bind(this);

    // use another canvas to create and render the background
    // so that the background is bigger than the frame canvas
    const backgroundCanvas = document.getElementById("background") as HTMLCanvasElement;
    const backgroundCtx = backgroundCanvas.getContext("2d");
    this.background = new Background();
    if (backgroundCtx) {
      this.background.create(backgroundCtx, backgroundCanvas);
    }
    for (let i = 0; i < 15; i++) {
      this.addComponent(this.asteroidGenerator.random(false));
    }
  }

  addComponent(component: Component) {
    this.components.push(component);
  }

  getNextPosition(component: Component): [number, number] {
    const [x, y] = component.getPosition();
    const speed = component.getSpeed();
    let heading = component.getHeading();
    if (heading < 0) {
      heading = 360 + heading;
    }
    let deg = heading;
    // not being super exact here. using halfShipWidth in both cases for simplicity
    const minX = halfShipWidth;
    const maxX = BOARD_WIDTH - component.getWidth();
    const minY = component.getWidth();
    const maxY = BOARD_HEIGHT - component.getWidth();
    if (heading < 90) {
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.min(x + adjacent, maxX), Math.min(y + opposite, maxY)];
    } else if (heading === 90) {
      return [x, Math.min(y + speed, maxY)];
    } else if (heading < 180) {
      deg = 180 - heading;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.max(x - adjacent, minX), Math.min(y + opposite, maxY)];
    } else if (heading === 180) {
      return [Math.max(x - speed, minX), y];
    } else if (heading < 270) {
      deg = heading - 180;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.max(x - adjacent, minX), Math.max(y - opposite, minY)];
    } else if (heading === 270) {
      return [x, Math.max(y - speed, minY)];
    } else {
      deg = 360 - heading;
      const adjacent = Math.cos(deg * RAD) * speed;
      const opposite = Math.sin(deg * RAD) * speed;
      return [Math.min(x + adjacent, maxX), Math.max(y - opposite, minY)]
    }
  }

  async pollUntilReady() {
    while (!this.background.isLoaded() || this.components.map((c) => c.isLoaded()).some((loaded) => !loaded)) {
      await timeout(1000)
    }
    // don't show canvas until everything is loaded
    this.canvas.className = "visible";
    document.addEventListener("keydown", this.ship.handleKeydown)
  }

  hurlAsteroids(num: number) {
    for (let i = 0; i < num; i++) {
      this.addComponent(this.asteroidGenerator.random(randomBoolean()));
    }
  }

  draw() {
    if (!this.context) {
      return;
    }
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const halfCanvasWidth = Math.floor(canvasWidth / 2);
    const halfCanvasHeight = Math.floor(canvasHeight / 2);
    this.context.clearRect(0, 0, canvasWidth, canvasHeight);

    // draw background first
    if (this.background) {
      this.background.draw(this.context, this.ship.x - halfCanvasWidth, this.ship.y - halfCanvasHeight, canvasWidth, canvasHeight);
    }

    const [shipX, shipY] = this.getNextPosition(this.ship);
    this.socket.emit("shipMoved", {
      x: shipX,
      y: shipY,
      degree: this.ship.deg,
      showThrusters: this.ship.showThrusters
    });
    this.ship.setPosition(shipX, shipY);
    this.ship.draw(this.context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);
    const positions = new Map<string, Component[]>();
    positions.set(`${shipX},${shipY}`, [this.ship]);
    const collisions = new Set();
    for (const component of this.components) {
        const [nextX, nextY] = this.getNextPosition(component);
        component.setPosition(nextX, nextY);
        component.draw(this.context, shipX, shipY, halfCanvasWidth, halfCanvasHeight);
        const key = `${nextX},${nextY}`;
        const matchingComponents = positions.get(key) || [];
        matchingComponents.push(component);
        positions.set(key, matchingComponents);
        if (matchingComponents.length > 1) {
          collisions.add(key);
        }
    }
  }

  animate() {
    if (!this.context) {
      return;
    }
    window.requestAnimationFrame(this.moveAndDraw)
  }

  async moveAndDraw() {
    if (this.ship.showThrusters && this.ship.speed < MAX_SPEED) {
      this.ship.speed++;
    }
    this.draw();
    await timeout(50);
    window.requestAnimationFrame(this.moveAndDraw);
  }
}
