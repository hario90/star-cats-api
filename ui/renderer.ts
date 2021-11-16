import { Socket } from "socket.io-client";
import { Background } from "./objects/background";
import { PlayerShip } from "./objects/player-ship";
import { timeout } from "./util";
import { DrawableShip } from "./objects/drawable-ship";
import { GameEventType, LaserBeamDTO } from "../shared/types";
import { Ship } from "../shared/objects/ship";
import { Alerts } from "./objects/alerts";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../shared/constants";
import { Asteroid } from "../shared/objects/asteroid";
import { DrawableAsteroid } from "./objects/drawable-asteroid";
import { createAsteroidSectionMap, getObjectSections, getSectionKey } from "../shared/util";
import { drawStats } from "./objects/stats";
import { DrawableLaserBeam } from "./objects/drawable-laser-beam";
import { Drawable } from "./objects/drawable";

const ALERT_MESSAGE_DURATION = 8;

export class Renderer {
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D | null;
  private ship: PlayerShip;
  private background: Background;
  private socket: Socket;
  private ships: Map<string, DrawableShip> = new Map();
  private asteroids: Map<string, DrawableAsteroid> = new Map();
  private laserBeams: Map<string, DrawableLaserBeam> = new Map();
  private halfCanvasWidth: number = 0;
  private halfCanvasHeight: number = 0;
  private alerts: Alerts = new Alerts();
  private sectionToAsteroids: Map<string, DrawableAsteroid[]> = new Map();
  private sectionToLaserBeams: Map<string, DrawableLaserBeam[]> = new Map();

  constructor(appEl: HTMLDivElement, socket: Socket, nickName: string) {
    this.ship = new PlayerShip(
      Math.random() * BOARD_WIDTH,
      Math.random() * BOARD_HEIGHT,
      nickName,
      socket.id,
      () => {
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
        this.alerts.push('You died!');
      },
      (laserBeam: LaserBeamDTO) => {
        this.laserBeams.set(laserBeam.id, new DrawableLaserBeam(laserBeam));
        this.socket.emit(GameEventType.EmitLaserBeam, laserBeam);
      },
    );

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

    socket.on(GameEventType.Announce, (message: string) => {
      console.log("announce")
      this.alerts.push(message)
    })

    socket.on(GameEventType.Ships, (ships: Ship[], asteroids: Asteroid[], laserBeams: LaserBeamDTO[]) => {
      this.sectionToAsteroids = createAsteroidSectionMap<DrawableAsteroid>();
      this.ship.id = socket.id;
      for (const ship of ships) {
        const mapShip = this.ships.get(ship.id);
        if (ship.id === this.ship.id) {
          this.ship.update(ship, this.sectionToAsteroids, socket);
        } else if (mapShip) {
          mapShip.update(ship, this.sectionToAsteroids, socket);
        } else {
          this.ships.set(ship.id, new DrawableShip({
            ...ship,
            onFinishedExploding: () => {
              this.alerts.push(`${ship.name} died!`);
            }
          }));
        }
      }
      for (const asteroid of asteroids) {
        const asteroid2 = new DrawableAsteroid(asteroid);
        const mapAsteroid = this.asteroids.get(asteroid2.id);
        if (mapAsteroid) {
          mapAsteroid.update(asteroid, this.sectionToAsteroids, this.socket);
        } else {
          this.asteroids.set(asteroid2.id, asteroid2);
        }
        const sections: Array<[number, number]> = getObjectSections(asteroid2);
        for (const [row, column] of sections) {
          const key = getSectionKey(row, column);
          const currObjects = this.sectionToAsteroids.get(key) || [];
          currObjects.push(asteroid2);
          this.sectionToAsteroids.set(key, currObjects);
        }
      }
      for (const laserBeamDTO of laserBeams) {
        const laserBeam = new DrawableLaserBeam(laserBeamDTO);
        const mapLaserBeam = this.laserBeams.get(laserBeam.id);
        if (mapLaserBeam) {
          mapLaserBeam.update(laserBeam, this.sectionToAsteroids, this.socket);
        } else {
          this.laserBeams.set(laserBeam.id, laserBeam)
        }
      }
    });

    socket.on(GameEventType.GameObjectMoved, (ship: Ship) => {
      const mapShip = this.ships.get(ship.id);
      if (mapShip) {
        mapShip.update(ship, this.sectionToAsteroids, socket);
      } else {
        this.ships.set(ship.id, new DrawableShip({
          ...ship,
          onFinishedExploding: () => {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
            this.alerts.push(`${ship.name} died!`);
          }
        }));
      }
    });

    socket.on(GameEventType.UserLeft, (userId: string, message: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push(message);
      this.ships.delete(userId);
    });
    socket.on(GameEventType.UserJoined, (nickname: string) => {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
      this.alerts.push(`${nickname} has joined`);
    });
    socket.on(GameEventType.ShipExploded, (shipId: string) => {
      if (this.ship.id === shipId) {
        console.log("this ship exploded")
        this.ship.explode();
      } else {
        const ship = this.ships.get(shipId);
        if (ship) {
          console.log("exploding ship")
          ship.explode();
        }
      }
    });
    socket.on(GameEventType.GameObjectMoved, (ship: Ship) => {
      const mapShip = this.ships.get(ship.id);
      if (mapShip) {
        mapShip.update(ship, this.sectionToAsteroids, socket);
      }
    });
    window.addEventListener("resize", this.setHeightWidth);
  }

  setHeightWidth() {
    this.canvas.height = document.body.clientHeight;
    this.canvas.width = document.body.clientWidth;
    this.halfCanvasWidth = Math.floor(this.canvas.width / 2);
    this.halfCanvasHeight = Math.floor(this.canvas.height / 2);
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
    this.socket.emit(event, ...args);
  }

  getObjectNextPositionAndEmit<T extends Drawable>(context: CanvasRenderingContext2D, gameObject: T): [number, number] {
    let x = gameObject.x;
    let y = gameObject.y;

    if (!gameObject.isDead) {
      const [nextShipX, nextShipY] = gameObject.getNextPosition();
      x = nextShipX;
      y = nextShipY;
      this.emit(GameEventType.GameObjectMoved, gameObject.toJSON());
      gameObject.update(
        {
          ...gameObject.toJSON(),
          x,
          y,
        }, this.sectionToAsteroids, this.socket);
    }
    return [x, y];
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

    const [x, y] = this.getObjectNextPositionAndEmit(this.context, this.ship);
    const shipX = x;
    const shipY = y;
    this.ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);

    for (const ship of this.ships.values()) {
      if (this.ship.id !== ship.id) {
        if (ship.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
          ship.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
        }
      }
    }
    for (const asteroid of this.asteroids.values()) {
      if (asteroid.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
        asteroid.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }
    for (const laserBeam of this.laserBeams.values()) {
      if (laserBeam.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
        this.getObjectNextPositionAndEmit(this.context, laserBeam);
        laserBeam.draw(this.context, shipX, shipY, this.halfCanvasWidth, this.halfCanvasHeight);
      }
    }

    drawStats(this.context, this.halfCanvasWidth, {
      points: this.ship.points,
      lives: this.ship.numLives
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
