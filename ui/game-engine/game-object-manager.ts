import { Socket } from "socket.io-client";
import { Asteroid } from "../../shared/objects/asteroid";
import { GameObject } from "../../shared/objects/game-object";
import { Ship } from "../../shared/objects/ship";
import { LaserBeamDTO, GemDTO, ShipDTO, AsteroidDTO, GameObjectType, GameEventType } from "../../shared/types";
import { distanceBetweenObjects, hasCollided, isOverlapping } from "../../shared/util";
import { Alerts } from "../objects/alerts";
import { Background } from "../objects/background";
import { DrawableAsteroid } from "../objects/drawable-asteroid";
import { DrawableGem } from "../objects/drawable-gem";
import { DrawableLaserBeam } from "../objects/drawable-laser-beam";
import { DrawableShip } from "../objects/drawable-ship";
import { PlayerShip } from "../objects/player-ship";
import { Section } from "../objects/section";
import { createSectionToObjectsMap } from "../util";
import { SocketEventEmitter } from "./socket-event-emitter";
import { DrawableObject, isDrawableShip, isDrawableAsteroid, isDrawableGem, isDrawableLaserBeam } from "./types";

const ALERT_MESSAGE_DURATION = 8;

type DTO = ShipDTO | AsteroidDTO | GemDTO | LaserBeamDTO;
const isShipDTO = (dto: DTO): dto is ShipDTO => dto.type === GameObjectType.Ship;
const isAsteroidDTO = (dto: DTO): dto is AsteroidDTO => dto.type === GameObjectType.Asteroid;
const isLaserBeamDTO = (dto: DTO): dto is LaserBeamDTO => dto.type === GameObjectType.LaserBeam;
const isGemDTO = (dto: DTO): dto is GemDTO => dto.type === GameObjectType.Gem;

interface GameEventTypes {
    move: GameEventType
}
const GAME_OBJECT_TYPE_TO_EMIT_TYPE: Map<GameObjectType, GameEventTypes> = new Map([
    [GameObjectType.Ship, {
        move: GameEventType.ShipMoved,
    }],
    [GameObjectType.Asteroid, {
        move: GameEventType.AsteroidMoved,
    }],
    [GameObjectType.LaserBeam, {
        move: GameEventType.LaserMoved,
    }]
]);

export class GameObjectManager {
    public ship: PlayerShip;
    public background: Background;
    public ships: Map<string, DrawableShip> = new Map();
    public asteroids: Map<string, DrawableAsteroid> = new Map();
    public laserBeams: Map<string, DrawableLaserBeam> = new Map();
    public gems: Map<string, DrawableGem> = new Map();
    public alerts: Alerts = new Alerts();
    public sectionToAsteroids: Map<string, Set<DrawableAsteroid>> = new Map();
    public sectionToLaserBeams: Map<string, Set<DrawableLaserBeam>> = new Map();
    public sectionToShips: Map<string, Set<DrawableShip>> = new Map();
    public sectionToGems: Map<string, Set<DrawableGem>> = new Map();
    private eventEmitter: SocketEventEmitter;
    private socket: Socket;

    constructor(eventEmitter: SocketEventEmitter, nickName: string, x: number, y: number, socket: Socket) {
        this.socket = socket;
        this.eventEmitter = eventEmitter;
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
            this.laserBeams.set(laserBeam.id, this.createLaserBeam(laserBeam));
            this.eventEmitter.fireLaserBeam(laserBeam);
          },
          this.eventEmitter
        );
        this.background = new Background();
        // use another canvas to create and render the background
        // so that the background is bigger than the frame canvas
        const backgroundCanvas = document.getElementById("background") as HTMLCanvasElement;
        const backgroundCtx = backgroundCanvas.getContext("2d");
        this.background = new Background();
        if (backgroundCtx) {
            this.background.create(backgroundCtx, backgroundCanvas);
        }

        socket.on(GameEventType.Announce, this.addAlert);
        socket.on(GameEventType.GetInitialObjects, this.receiveInitialObjects);
        socket.on(GameEventType.ShipMoved, this.moveShip);
        socket.on(GameEventType.LaserMoved, this.moveLaserBeam);
        socket.on(GameEventType.AsteroidMoved, this.moveAsteroid);
        socket.on(GameEventType.AsteroidExploded, (asteroidId: string) => {})
        socket.on(GameEventType.UserLeft, this.handleUserLeft);
        socket.on(GameEventType.UserJoined, this.handleUserJoined);
        socket.on(GameEventType.ShipExploded, this.handleShipExploded);
        socket.on(GameEventType.ShipPickedUpGem, this.handleShipPickedUpGem);
        socket.on(GameEventType.AsteroidHit, this.handleAsteroidHit);
        socket.on(GameEventType.AddGems, this.addGems);

        this.addAlert = this.addAlert.bind(this);
        this.removeObject = this.removeObject.bind(this);
        this.getSectionToObjects = this.getSectionToObjects.bind(this);
        this.getObjects = this.getObjects.bind(this);
        this.syncSectionToObjects = this.syncSectionToObjects.bind(this);
        this.receiveInitialObjects = this.receiveInitialObjects.bind(this);
    }

    public addAlert = (message: string) => {
        this.alerts.push(message);
    }

    private getSectionToObjects = (object: DrawableObject) => {
        let sectionToObjects: Map<string, Set<DrawableObject>> | undefined = undefined;
        if (isDrawableShip(object)) {
            sectionToObjects = this.sectionToShips;
        } else if (isDrawableAsteroid(object)) {
            sectionToObjects = this.sectionToAsteroids;
        } else if (isDrawableGem(object)) {
            sectionToObjects = this.sectionToGems;
        } else if (isDrawableLaserBeam(object)) {
            sectionToObjects = this.sectionToLaserBeams;
        } else {
            throw new Error(`Object is not supported`);
        }

        return sectionToObjects;
    }

    private getObjects = (object: DrawableObject) => {
        let objects;
        if (isDrawableShip(object)) {
            objects = this.ships;
        } else if (isDrawableAsteroid(object)) {
            objects = this.asteroids;
        } else if (isDrawableGem(object)) {
            objects = this.gems;
        } else if (isDrawableLaserBeam(object)) {
            objects = this.laserBeams;
        } else {
            throw new Error(`Object is not supported`);
        }

        return objects;
    }

    public syncSectionToObjects = (object: DrawableObject, prevSections?: Map<string, Section>) => {
        const sectionToObjects = this.getSectionToObjects(object);

        for (const [key] of object.sections) {
            const objectsInSection = sectionToObjects.get(key) || new Set();
            objectsInSection.add(object);

            // todo not sure if this is necessary
            sectionToObjects.set(key, objectsInSection);
        }

        if (prevSections) {
            for (const [key] of prevSections) {
                if (!object.sections.has(key)) {
                    sectionToObjects.delete(key);
                }
            }
        }
    }

    public receiveInitialObjects = (ships: Ship[], asteroids: Asteroid[], laserBeams: LaserBeamDTO[], gems: GemDTO[]): void => {
        console.log("socket id", this.socket.id)
        this.ship.id = this.socket.id;
        this.sectionToAsteroids = createSectionToObjectsMap<DrawableAsteroid>();
        this.sectionToLaserBeams = createSectionToObjectsMap<DrawableLaserBeam>();
        this.sectionToGems = createSectionToObjectsMap<DrawableGem>();

        this.syncSectionToObjects(this.ship);
        for (const ship of ships) {
          if (ship.id !== this.ship.id) {
            const drawableShip = new DrawableShip({
              ...ship,
              x: ship.x,
              y: ship.y,
              eventEmitter: this.eventEmitter,
              onFinishedExploding: () => {
                this.alerts.push(`${ship.name} died!`);
              }
            });
            this.ships.set(ship.id, drawableShip);
            this.syncSectionToObjects(drawableShip);
          }
        }
        for (const asteroid of asteroids) {
          const asteroid2 = this.createAsteroid(asteroid);
          this.asteroids.set(asteroid2.id, asteroid2);
          for (const [key] of asteroid2.sections) {
            const currObjects = this.sectionToAsteroids.get(key) || new Set();
            currObjects.add(asteroid2);
            this.sectionToAsteroids.set(key, currObjects);
          }
        }
        for (const laserBeamDTO of laserBeams) {
          const laserBeam = this.createLaserBeam(laserBeamDTO);
          this.laserBeams.set(laserBeam.id, laserBeam)
          const currObjects = this.sectionToLaserBeams.get(laserBeam.section.key) || new Set();
          currObjects.add(laserBeam);
          this.sectionToLaserBeams.set(laserBeam.section.key, currObjects);
        }
        for (const gemDTO of gems) {
          const gem = this.createGem(gemDTO);
          this.gems.set(gem.id, gem);
          for (const [key] of gem.sections) {
            const currObjects = this.sectionToGems.get(key) || new Set();
            currObjects.add(gem);
            this.sectionToGems.set(key, currObjects);
          }
        }
    }

    public removeObject = (object: DrawableObject): void => {
        const sectionToObjects = this.getSectionToObjects(object);
        for (const [key] of object.sections) {
            const objectsInSection = sectionToObjects.get(key);
            if (objectsInSection) {
                objectsInSection.delete(object);
            }
        }

        const objects = this.getObjects(object);
        objects.delete(object.id);
    }

    public getAllObjects = () => {
        return [
            ...this.ships.values(),
            ...this.asteroids.values(),
            ...this.laserBeams.values(),
            ...this.gems.values()
        ];
    }

    public notReadyToRender = () => {
        const allObjects = this.getAllObjects();
        return !this.background.isLoaded() ||
            allObjects.map((c) => c.isLoaded()).some((loaded) => !loaded);
    }

    public getObjectNextPositionAndEmit = (gameObject: DrawableObject): [number, number] => {
        let x = gameObject.x;
        let y = gameObject.y;

        if (!gameObject.isDead) {
            const prevSections = new Map(gameObject.sections);
            const [nextX, nextY] = gameObject.getNextPosition();
            x = nextX;
            y = nextY;

            gameObject.update({...gameObject.toDTO(), x, y});
            const emitType = GAME_OBJECT_TYPE_TO_EMIT_TYPE.get(gameObject.type);
            if (emitType) {
                this.eventEmitter.gameObjectMoved(emitType.move, gameObject);
            }

            // update section map
            this.syncSectionToObjects(gameObject, prevSections);

            // check for collision
            if (isDrawableShip(gameObject)) {
                // check for collisions into asteroids, laserbeams, gems
                for (const [key] of gameObject.sections) {
                    const asteroids = this.sectionToAsteroids.get(key) || [];
                    const gems = this.sectionToGems.get(key) || [];
                    const laserBeams = this.sectionToLaserBeams.get(key) || [];

                    // no asteroids logged but there should be.
                    for (const obj of [...asteroids, ...gems, ...laserBeams]) {
                        if (isOverlapping(gameObject, obj)) {
                            gameObject.whenHitBy(obj);
                            obj.whenHitBy(gameObject);
                        }
                    }
                }
            } else if (isDrawableLaserBeam(gameObject)) {
                const { row, col} = gameObject.section;
                const prevSection = gameObject.prevSection;
                if (prevSection) {
                    const { row: prevRow, col: prevCol } = prevSection;
                    if (row !== prevRow || col !== prevCol) {
                        const laserBeamsInSection = this.sectionToLaserBeams.get(prevSection.key) || new Set();
                        laserBeamsInSection.delete(gameObject);
                        const laserBeamsInNewSection = this.sectionToLaserBeams.get(gameObject.section.key) || new Set();
                        laserBeamsInNewSection.add(gameObject);
                    }
                }

                const asteroidsInMySection = this.sectionToAsteroids.get(gameObject.section.key) || new Set();
                for (const asteroid of asteroidsInMySection) {
                    if (distanceBetweenObjects(asteroid, gameObject) <= 0) {
                        asteroid.whenHitBy(gameObject);
                        gameObject.whenHitBy(asteroid);
                        break;
                    }
                }
            }

        }

        return [x, y];
    }

    public moveShip = (object: ShipDTO) => {
        const mapShip = this.ships.get(object.id);
        if (mapShip) {
            mapShip.update(object);
        } else {
            this.ships.set(object.id, this.createShip(object));
        }
    }

    public moveAsteroid = (object: AsteroidDTO) => {
        const mapAsteroid = this.asteroids.get(object.id);
        if (mapAsteroid) {
            mapAsteroid.update(object);
        } else {
            this.asteroids.set(object.id, this.createAsteroid(object));
        }
    }

    public moveLaserBeam = (object: LaserBeamDTO) => {
        const mapLaserBeam = this.laserBeams.get(object.id);
        if (mapLaserBeam) {
            mapLaserBeam.update(object);
        } else {
            this.laserBeams.set(object.id, this.createLaserBeam(object));
        }
    }

    public handleUserLeft = (userId: string, message: string) => {
        this.alerts.push(message);
        this.ships.delete(userId);
        const ship = this.ships.get(userId);
        if (ship) {
            this.removeObject(ship);
        }
    }

    public handleUserJoined = (nickname: string) => {
        this.alerts.push(`${nickname} has joined`);
    };

    public handleShipExploded = (shipId: string) => {
        if (this.ship.id === shipId) {
            this.ship.explode();
        } else {
            const ship = this.ships.get(shipId);
            if (ship) {
            ship.explode();
            }
        }
    }

    public handleShipPickedUpGem = (shipId: string, gemId: string, shipPoints: number) => {
        const matchingShip = this.ships.get(shipId);
        const matchingGem = this.gems.get(gemId);
        if (matchingShip) {
            matchingShip.points = shipPoints;
        }
        if (matchingGem) {
            this.gems.delete(gemId);
            for (const [key] of matchingGem.sections) {
            const matchingGemsInSection = this.sectionToGems.get(key);
            if (matchingGemsInSection) {
                matchingGemsInSection.delete(matchingGem);
            }
            }
        }
    };

    public handleAsteroidHit = (asteroidId: string, laserBeamId: string, asteroidWidth: number) => {
        const matchingAsteroid = this.asteroids.get(asteroidId);
        if (matchingAsteroid) {
          matchingAsteroid.width = asteroidWidth;
        }

        const laserBeam = this.laserBeams.get(laserBeamId);
        if (laserBeam) {
            this.removeObject(laserBeam);
        }
      };

    public addGems = (gems: GemDTO[]) => {
        for (const gem of gems) {
          this.gems.set(gem.id, this.createGem(gem));
        }
      }

    private createShip = (dto: ShipDTO) => {
        return new DrawableShip({
            ...dto,
            eventEmitter: this.eventEmitter,
            onFinishedExploding: (name: string) => {
                const expires = new Date();
                expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
                this.alerts.push(`${name} died!`);
            }
        });
    }

    private createAsteroid = (dto: AsteroidDTO) => {
        return new DrawableAsteroid({
            ...dto,
            eventEmitter: this.eventEmitter,
            onFinishedExploding: this.removeObject,
        });
    }

    private createGem = (dto: GemDTO) => {
        return new DrawableGem({
            ...dto,
            eventEmitter: this.eventEmitter,
        });
    }

    private createLaserBeam = (dto: LaserBeamDTO) => {
        return new DrawableLaserBeam({
            ...dto,
            eventEmitter: this.eventEmitter,
        });
    }
 }