import { Socket } from "socket.io-client";
import { AsteroidGenerator } from "./asteroid-generator";
import { Background } from "./objects/background";
import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import { halfShipWidth, PlayerShip, RAD } from "./objects/player-ship";
import { Component } from "./types";
import { randomBoolean, timeout } from "./util";
import { DrawableShip } from "./objects/drawable-ship";
import { GameEventType } from "../shared/types";
import { Ship } from "../server/objects/ship";
import { Alerts } from "./objects/alerts";

const ALERT_MESSAGE_DURATION = 8;

export class Renderer {
  private components: Component[] = [];
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null;
  private ship: PlayerShip;
  private background: Background;
  // TODO move this to server
  private asteroidGenerator: AsteroidGenerator;
  private socket: Socket;
  private ships: DrawableShip[] = [];
  private halfCanvasWidth: number;
  private halfCanvasHeight: number;
  private frameRate: number;
  private alerts: Alerts = new Alerts();

  constructor(appEl: HTMLDivElement, socket: Socket, ship: PlayerShip, frameRate: number = 50) {
    this.ship = ship;
    this.socket = socket;
    this.frameRate = frameRate;

    this.canvas.height = document.body.clientHeight;
    this.canvas.width = document.body.clientWidth;
    this.halfCanvasWidth = Math.floor(this.canvas.width / 2);
    this.halfCanvasHeight = Math.floor(this.canvas.height / 2);

    appEl.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("no context");
    }
    this.asteroidGenerator = new AsteroidGenerator();
    this.draw = this.draw.bind(this);
    this.animate = this.animate.bind(this);
    this.moveAndDraw = this.moveAndDraw.bind(this);
    this.getNextPosition = this.getNextPosition.bind(this);
    this.setShips = this.setShips.bind(this);

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

    socket.on(GameEventType.Ships, (ships: Ship[]) => {
      console.log("received ships", ships)
      const drawableShips = ships.map((ship) => new DrawableShip(ship))
      this.setShips(drawableShips);
    });
    socket.on(GameEventType.UserLeft, (nickname: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push({
        message: `${nickname} has left the game`,
        expires,
      })
    })
    socket.on(GameEventType.UserJoined, (nickname: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push({
        message: `${nickname} has joined`,
        expires,
      });
    })
  }

  setShips(ships: DrawableShip[]) {
    this.ships = ships;
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
    while (!this.background.isLoaded() || [...this.components, ...this.ships].map((c) => c.isLoaded()).some((loaded) => !loaded)) {
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
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // draw background first
    if (this.background) {
      this.background.draw(this.context, this.ship.x - this.halfCanvasWidth, this.ship.y - this.halfCanvasHeight, this.canvas.width, this.canvas.height);
    }
    this.alerts.draw(this.context, this.halfCanvasWidth, this.halfCanvasHeight);

    const [shipX, shipY] = this.getNextPosition(this.ship);
    this.socket.emit(GameEventType.ShipMoved, {
      x: shipX,
      y: shipY,
      speed: this.ship.speed,
      deg: this.ship.deg,
    });
    this.ship.setPosition(shipX, shipY);
    this.ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
    const positions = new Map<string, Component[]>();
    positions.set(`${shipX},${shipY}`, [this.ship]);
    const collisions = new Set();

    for (const component of [...this.ships, ...this.components]) {
        // is it in the frame?
        if (this.socket.id !== component.getSocketId() && component.getSocketId()) {
          // console.log(component.getHeading());
        }
        if (this.isInFrame(component) && this.socket.id !== component.getSocketId()) {
          component.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
        }

        const [x, y] = component.getPosition();
        const key = `${x},${y}`;
        const matchingComponents = positions.get(key) || [];
        matchingComponents.push(component);
        positions.set(key, matchingComponents);
        if (matchingComponents.length > 1) {
          collisions.add(key);
        }
    }

    // show alerts
    this.context.font = "14px Arial";
    this.context.fillStyle = "white";
  }

  isInFrame(component: Component) {
    const [x, y] = component.getPosition();
    const minX = x - this.halfCanvasWidth;
    const maxX = x + this.halfCanvasWidth;
    const minY = y - this.halfCanvasHeight;
    const maxY = y + this.halfCanvasHeight;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  animate() {
    if (!this.context) {
      return;
    }
    window.requestAnimationFrame(this.moveAndDraw)
  }

  async moveAndDraw() {
    this.draw();
    await timeout(this.frameRate);
    window.requestAnimationFrame(this.moveAndDraw);
  }
}
