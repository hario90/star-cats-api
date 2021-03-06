import { Socket } from "socket.io-client";
import { Background } from "./objects/background";
import { halfShipWidth, PlayerShip, RAD } from "./objects/player-ship";
import { timeout } from "./util";
import { DrawableShip } from "./objects/drawable-ship";
import { GameEventType } from "../shared/types";
import { Ship } from "../server/objects/ship";
import { Alerts } from "./objects/alerts";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../shared/constants";
import { Asteroid } from "../server/objects/asteroid";
import { DrawableAsteroid } from "./objects/drawable-asteroid";
import { Drawable } from "./objects/drawable";

const ALERT_MESSAGE_DURATION = 8;
const EMIT_THROTTLE = 500;

export class Renderer {
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null;
  private ship: PlayerShip;
  private background: Background;
  private socket: Socket;
  private ships: Map<string, DrawableShip> = new Map();
  private asteroids: Map<string, DrawableAsteroid> = new Map();
  private halfCanvasWidth: number = 0;
  private halfCanvasHeight: number = 0;
  private alerts: Alerts = new Alerts();
  private lastShipMovedEmit: Date | null = null;

  constructor(appEl: HTMLDivElement, socket: Socket, ship: PlayerShip) {
    this.ship = ship;
    this.socket = socket;

    this.setHeightWidth();

    appEl.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("no context");
    }
    this.draw = this.draw.bind(this);
    this.animate = this.animate.bind(this);
    this.moveAndDraw = this.moveAndDraw.bind(this);
    this.getNextPosition = this.getNextPosition.bind(this);
    this.emit = this.emit.bind(this);
    this.setHeightWidth = this.setHeightWidth.bind(this);

    // use another canvas to create and render the background
    // so that the background is bigger than the frame canvas
    const backgroundCanvas = document.getElementById("background") as HTMLCanvasElement;
    const backgroundCtx = backgroundCanvas.getContext("2d");
    this.background = new Background();
    if (backgroundCtx) {
      this.background.create(backgroundCtx, backgroundCanvas);
    }

    socket.on(GameEventType.Ships, (ships: Ship[], asteroids: Asteroid[]) => {
      for (const ship of ships) {
        const mapShip = this.ships.get(ship.id);
        if (mapShip) {
          mapShip.update(ship);
        } else {
          this.ships.set(ship.id, new DrawableShip(ship));
        }
      }
      for (const asteroid of asteroids) {
        const mapAsteroid = this.asteroids.get(asteroid.id);
        if (mapAsteroid) {
          mapAsteroid.update(asteroid);
        } else {
          this.asteroids.set(asteroid.id, new DrawableAsteroid(asteroid));
        }
      }
    });
    socket.on(GameEventType.UserLeft, (nickname: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push({
        message: `${nickname} has left the game`,
        expires,
      })
    });
    socket.on(GameEventType.UserJoined, (nickname: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push({
        message: `${nickname} has joined`,
        expires,
      });
    });
    window.addEventListener("resize", this.setHeightWidth);
  }

  setHeightWidth() {
    this.canvas.height = document.body.clientHeight;
    this.canvas.width = document.body.clientWidth;
    this.halfCanvasWidth = Math.floor(this.canvas.width / 2);
    this.halfCanvasHeight = Math.floor(this.canvas.height / 2);
  }

  getNextPosition<T extends Drawable>(component: T): [number, number] {
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

    while (!this.background.isLoaded() || [...this.ships.values(), ...this.asteroids.values()].map((c) => c.isLoaded()).some((loaded) => !loaded)) {
      await timeout(1000)
    }
    // don't show canvas until everything is loaded
    this.canvas.className = "visible";
    document.addEventListener("keydown", this.ship.handleKeydown)
  }

  emit(event: GameEventType, ...args: any[]) {
    const now = new Date();
    if (!this.lastShipMovedEmit || now.getTime() - this.lastShipMovedEmit.getTime() > EMIT_THROTTLE) {
      this.socket.emit(event, ...args);
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
    this.emit(GameEventType.ShipMoved, {
      x: shipX,
      y: shipY,
      speed: this.ship.speed,
      deg: this.ship.deg, // todo
    });
    this.ship.setPosition(shipX, shipY);
    this.ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
    // const positions = new Map<string, Array<DrawableShip | DrawableAsteroid>>();
    // positions.set(`${shipX},${shipY}`, [this.ship]);
    // const collisions = new Set();

    for (const ship of this.ships.values()) {
      if (this.ship.id !== ship.id) {
        if (this.isInFrame(ship)) {
          ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
        }
      }
    }
    for (const asteroid of this.asteroids.values()) {
      if (this.isInFrame(asteroid)) {
        asteroid.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }
    // const components = [...this.ships, ...this.asteroids];
    // for (const component of components) {
    //     // is it in the frame?
    //     if (this.ship.id !== component.id) {
    //       if (this.isInFrame(component)) {
    //         component.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
    //       }

    //       // const [x, y] = component.getPosition();
    //       // const key = `${x},${y}`;
    //       // const matchingComponents = positions.get(key) || [];
    //       // matchingComponents.push(component);
    //       // positions.set(key, matchingComponents);
    //       // if (matchingComponents.length > 1) {
    //       //   collisions.add(key);
    //       // }
    //     }
    // }
  }

  isInFrame<T extends Drawable>(component: T) {
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
    window.requestAnimationFrame(this.moveAndDraw);
  }
}
