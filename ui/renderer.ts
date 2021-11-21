import { Socket } from "socket.io-client";
import { Background } from "./objects/background";
import { PlayerShip } from "./objects/player-ship";
import { timeout } from "./util";
import { DrawableShip } from "./objects/drawable-ship";
import { AsteroidDTO, GameEventType, GameObjectDTO, GameObjectType, isAsteroidDTO, isLaserBeamDTO, isShipDTO, LaserBeamDTO, ShipDTO } from "../shared/types";
import { Ship } from "../shared/objects/ship";
import { Alerts } from "./objects/alerts";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../shared/constants";
import { Asteroid } from "../shared/objects/asteroid";
import { DrawableAsteroid } from "./objects/drawable-asteroid";
import { createSectionToObjectsMap, getObjectSections, getSectionKey } from "../shared/util";
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
  private sectionToAsteroids: Map<string, Set<DrawableAsteroid>> = new Map();
  private sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>> = new Map();
  private sectionToShips: Map<string, Set<DrawableShip>> = new Map();

  constructor(appEl: HTMLDivElement, socket: Socket, nickName: string, x: number, y: number) {
    this.ship = new PlayerShip(
      x,
      y,
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

    const updateSectionToShips = (drawableShip: DrawableShip) => {
      for (const [key] of drawableShip.sections) {
        const shipsInSection = this.sectionToShips.get(key) || new Set();
        shipsInSection.add(drawableShip);
        this.sectionToShips.set(key, shipsInSection);
      }
    };

    socket.on(GameEventType.GetInitialObjects, (ships: Ship[], asteroids: Asteroid[], laserBeams: LaserBeamDTO[]) => {
      this.sectionToAsteroids = createSectionToObjectsMap<DrawableAsteroid>();
      this.sectionToLaserBeams = createSectionToObjectsMap<DrawableLaserBeam>();
      this.ship.id = socket.id;
      updateSectionToShips(this.ship);
      for (const ship of ships) {
        if (ship.id !== this.ship.id) {
          const drawableShip = new DrawableShip({
            ...ship,
            x: ship.x,
            y: ship.y,
            onFinishedExploding: () => {
              this.alerts.push(`${ship.name} died!`);
            }
          });
          this.ships.set(ship.id, drawableShip);
          updateSectionToShips(drawableShip);
        }
      }
      console.log(this.sectionToShips);
      for (const asteroid of asteroids) {
        const asteroid2 = new DrawableAsteroid({
          ...asteroid,
          onFinishedExploding: (id: string) => console.log("todo: add gem to screen")
        });
        this.asteroids.set(asteroid2.id, asteroid2);
        for (const [key] of asteroid2.sections) {
          const currObjects = this.sectionToAsteroids.get(key) || new Set();
          currObjects.add(asteroid2);
          this.sectionToAsteroids.set(key, currObjects);
        }
      }
      for (const laserBeamDTO of laserBeams) {
        const laserBeam = new DrawableLaserBeam(laserBeamDTO);
        this.laserBeams.set(laserBeam.id, laserBeam)
        const {row, col} = laserBeam.section
        const key = getSectionKey(row, col);
        const currObjects = this.sectionToLaserBeams.get(key) || new Set();
        currObjects.add(laserBeam);
        this.sectionToLaserBeams.set(key, currObjects);
      }
    });

    socket.on(GameEventType.ShipMoved, (object: ShipDTO) => {
      const mapShip = this.ships.get(object.id);
      if (mapShip) {
        mapShip.update(object, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
      } else {
        this.ships.set(object.id, new DrawableShip({
          ...object,
          onFinishedExploding: (name: string) => {
            const expires = new Date();
            expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
            this.alerts.push(`${name} died!`);
          }
        }));
      }
    });

    socket.on(GameEventType.LaserMoved, (object: LaserBeamDTO) => {
      const mapLaserBeam = this.laserBeams.get(object.id);
      if (mapLaserBeam) {
        mapLaserBeam.update(object, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
      } else {
        this.laserBeams.set(object.id, new DrawableLaserBeam(object));
      }
    });

    socket.on(GameEventType.AsteroidMoved, (object: AsteroidDTO) => {
      const mapAsteroid = this.asteroids.get(object.id);
      if (mapAsteroid) {
        mapAsteroid.update(object, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
      } else {
        this.asteroids.set(object.id, new DrawableAsteroid({
          ...object,
          onFinishedExploding: (id: string) => console.log("todo: add gem to screen")
        }));
      }
    });

    socket.on(GameEventType.AsteroidExploded, (asteroidId: string) => {

    })

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
        this.ship.explode(this.socket);
      } else {
        const ship = this.ships.get(shipId);
        if (ship) {
          ship.explode(this.socket);
        }
      }
    });
    socket.on(GameEventType.ShipMoved, (obj: GameObjectDTO) => {
      if (isShipDTO(obj)) {
        const mapShip = this.ships.get(obj.id);
        if (mapShip) {
          mapShip.update(obj, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
        }
      } else if (isAsteroidDTO(obj)) {
        const mapAsteroid = this.asteroids.get(obj.id);
        if (mapAsteroid) {
          mapAsteroid.update(obj, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
        }
      } else if (isLaserBeamDTO(obj)) {
        const mapLaserBeam = this.laserBeams.get(obj.id);
        if (mapLaserBeam) {
          mapLaserBeam.update(obj, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, socket);
        }
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
    let emitType = GameEventType.ShipMoved;
    if (gameObject.type === GameObjectType.Asteroid) {
      emitType = GameEventType.AsteroidMoved;
    } else if (gameObject.type === GameObjectType.LaserBeam) {
      emitType = GameEventType.LaserMoved;
    }

    if (!gameObject.isDead) {
      const [nextShipX, nextShipY] = gameObject.getNextPosition();
      x = nextShipX;
      y = nextShipY;
      this.emit(emitType, gameObject.toJSON());
      gameObject.update(
        {
          ...gameObject.toJSON(),
          x,
          y,
        }, this.sectionToAsteroids, this.sectionToShips, this.sectionToLaserBeams, this.socket);
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
      this.getObjectNextPositionAndEmit(this.context, laserBeam);
      if (laserBeam.isInFrame(this.halfCanvasWidth, this.halfCanvasHeight)) {
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
