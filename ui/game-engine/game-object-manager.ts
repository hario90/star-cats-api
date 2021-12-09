import { Socket } from "socket.io-client";
import { MIN_ASTEROID_HEIGHT } from "../../shared/constants";
import { Asteroid } from "../../shared/objects/asteroid";
import { Ship } from "../../shared/objects/ship";
import { LaserBeamDTO, GemDTO, ShipDTO, AsteroidDTO, GameObjectType, GameEventType } from "../../shared/types";
import { distanceBetweenObjects, isOverlapping } from "../../shared/util";
import { Alerts } from "../objects/alerts";
import { Background } from "../objects/background";
import { Drawable } from "../objects/drawable";
import { DrawableAsteroid } from "../objects/drawable-asteroid";
import { DrawableGem } from "../objects/drawable-gem";
import { DrawableLaserBeam } from "../objects/drawable-laser-beam";
import { DrawableShip } from "../objects/drawable-ship";
import { PlayerShip } from "../objects/player-ship";
import { Section } from "../objects/section";
import { DrawableObjectMap } from "./drawable-object-map";
import { SocketEventEmitter } from "./socket-event-emitter";
import { DrawableObject, isDrawableShip, isDrawableAsteroid, isDrawableGem, isDrawableLaserBeam } from "./types";

const ALERT_MESSAGE_DURATION = 8;

type DTO = ShipDTO | AsteroidDTO | GemDTO | LaserBeamDTO;

interface GameEventTypes {
    move: GameEventType
}
const GAME_OBJECT_TYPE_TO_EMIT_TYPE: Map<GameObjectType, GameEventTypes> = new Map([
    [GameObjectType.Ship, {
        move: GameEventType.ShipMoved,
    }],
]);

export class GameObjectManager {
    public background: Background;
    public ship?: PlayerShip;
    public ships: DrawableObjectMap<DrawableShip | PlayerShip> = new DrawableObjectMap();
    public asteroids: DrawableObjectMap<DrawableAsteroid> = new DrawableObjectMap();
    public laserBeams: DrawableObjectMap<DrawableLaserBeam> = new DrawableObjectMap();
    public gems: DrawableObjectMap<DrawableGem> = new DrawableObjectMap();
    public alerts: Alerts = new Alerts();
    private eventEmitter: SocketEventEmitter;
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
        this.eventEmitter = new SocketEventEmitter(socket);
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
        // socket.on(GameEventType.AsteroidExploded, this.handleAsteroidExploded)
        socket.on(GameEventType.UserLeft, this.handleUserLeft);
        socket.on(GameEventType.UserJoined, this.handleUserJoined);
        // socket.on(GameEventType.ShipExploded, this.handleShipExploded);
        socket.on(GameEventType.ShipPickedUpGem, this.handleShipPickedUpGem);
        socket.on(GameEventType.AsteroidHit, this.handleAsteroidHit);
        socket.on(GameEventType.AddGem, this.addGem);
        socket.on(GameEventType.ShipDamage, this.handleShipDamage);

        this.addAlert = this.addAlert.bind(this);
        this.getObjects = this.getObjects.bind(this);
        this.receiveInitialObjects = this.receiveInitialObjects.bind(this);
    }

    public addAlert = (message: string) => {
        this.alerts.push(message);
    }

    private getObjects = (object: DrawableObject): any => {
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

    public registerObjects = <T extends Drawable>(dto: DTO[], objectMap: DrawableObjectMap<T>, createDrawable: (dto: DTO) => T, prevSections?: Map<string, Section>) => {
        for (const object of dto) {
            const drawableObject = createDrawable(object);
            objectMap.set(drawableObject.id, drawableObject, prevSections);
        }
    }

    public receiveInitialObjects = (ships: Ship[], asteroids: Asteroid[], laserBeams: LaserBeamDTO[], gems: GemDTO[]): void => {
        const playerShipDTO = ships.find((s) => s.id === this.socket.id);
        if (playerShipDTO) {
            this.ship = this.createPlayerShip(playerShipDTO);
        } else {
            throw new Error("Where is the main player's ship?")
        }

        const otherShipDTOs = ships.filter((s) => s.id !== this.socket.id);
        this.registerObjects(otherShipDTOs, this.ships, this.createShip);
        this.registerObjects(asteroids, this.asteroids, this.createAsteroid);
        this.registerObjects(laserBeams, this.laserBeams, this.createLaserBeam);
        this.registerObjects(gems, this.gems, this.createGem);
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
        return !this.background.isLoaded() || !this.ship ||
            allObjects.map((c) => c.isLoaded()).some((loaded) => !loaded);
    }

    public getObjectNextPositionAndEmit = (gameObject: DrawableObject): [number, number] => {
        let x = gameObject.x;
        let y = gameObject.y;
        if (gameObject.isDead) {
            return [x, y];
        }

        const prevSections = new Map(gameObject.sections);
        const [nextX, nextY] = gameObject.getNextPosition();

        x = nextX;
        y = nextY;

        gameObject.update({...gameObject.toDTO(), x, y});

        const emitType = GAME_OBJECT_TYPE_TO_EMIT_TYPE.get(gameObject.type);
        if (emitType) {
            let cb = undefined;
            if (gameObject.type === GameObjectType.Ship) {
                cb = this.moveShips;
            }

            this.eventEmitter.gameObjectMoved(emitType.move, gameObject, cb);
        }

        // update section map
        const objects = this.getObjects(gameObject);
        objects.sync(gameObject, prevSections);

        // check for collision
        if (isDrawableShip(gameObject)) {
            // check for collisions into asteroids, laserbeams, gems
            for (const [key] of gameObject.sections) {
                const asteroids = this.asteroids.getObjectsInSection(key);
                const gems = this.gems.getObjectsInSection(key);
                const ships = this.ships.getObjectsInSection(key);

                for (const asteroid of asteroids) {
                    if (!gameObject.isDead && !asteroid.isDead && isOverlapping(gameObject, asteroid)) {
                        this.handleShipHitAsteroid(gameObject, asteroid);
                    }
                }

                for (const gem of gems) {
                    // assume that the ship is always the player ship. otherwise we're emitting
                    // too much
                    if (isOverlapping(gameObject, gem)) {
                        this.handleShipPickedUpGemAndEmit(gameObject.id, gem);
                    }
                }

                for (const ship of ships) {
                    if (!ship.isDead && ship.id !== gameObject.id && isOverlapping(ship, gameObject)) {
                        this.handleShipHitShip(gameObject, ship);
                    }
                }
            }
        } else if (isDrawableLaserBeam(gameObject)) {
            const { row, col} = gameObject.section;
            const prevSection = gameObject.prevSection;
            if (prevSection) {
                const { row: prevRow, col: prevCol } = prevSection;
                if (row !== prevRow || col !== prevCol) {
                    this.laserBeams.sync(gameObject);
                }
            }

            const asteroidsInMySection = this.asteroids.getObjectsInSection(gameObject.section.key);
            for (const asteroid of asteroidsInMySection) {
                if (asteroid && distanceBetweenObjects(asteroid, gameObject) <= 0) {
                    this.handleLaserBeamHitAsteroidAndEmit(gameObject, asteroid);
                    break;
                }
            }

            const shipsInMySection = this.ships.getObjectsInSection(gameObject.section.key);
            for (const ship of shipsInMySection) {
                if (ship && distanceBetweenObjects(ship, gameObject) <= 0) {
                    this.handleLaserBeamHitShipAndEmit(gameObject, ship);
                    break;
                }
            }
        }

        return [x, y];
    }

    // have front end handle ship explosion
    // have server handle
    private handleShipHitAsteroid = (ship: DrawableShip, asteroid: DrawableAsteroid) => {
        ship.explode();
        if (ship.isMainShip) {
            this.eventEmitter.shipDamaged(this.handleShipDamage, {asteroidId: asteroid.id});
        }
    }

    private handleShipHitShip = (ship1: DrawableShip, ship2: DrawableShip) => {
        console.log("ship hit ship")
        ship1.explode();
        ship2.explode();
        if (ship1.isMainShip) {
            this.eventEmitter.shipExploded(ship1.id, this.handleShipExploded);
        } else if (ship2.isMainShip) {
            this.eventEmitter.shipExploded(ship2.id, this.handleShipExploded);
        }
    }

    // have the front end handle deleting the laser beam and asteroid
    // have the server handle creating the new asteroids and gems
    private handleLaserBeamHitAsteroidAndEmit = (laserBeam: DrawableLaserBeam, asteroid: DrawableAsteroid): void => {
        this.laserBeams.delete(laserBeam.id);
        const laserBeamWasFiredByThisShip = this.ship?.id === laserBeam.fromShipId;
        if (asteroid.radius < MIN_ASTEROID_HEIGHT) {
            asteroid.explode();

            // only one client should be responsible for sending this event
            if (laserBeamWasFiredByThisShip) {
                console.log("emitting asteroid exploded")
                this.eventEmitter.asteroidExploded(asteroid.toDTO(), laserBeam.id, this.addGem);
            }
        } else {
            this.asteroids.delete(asteroid.id)
             // only one client should be responsible for sending this event
            if (laserBeamWasFiredByThisShip) {
                this.eventEmitter.asteroidHitByLaserBeam(asteroid.toDTO(), laserBeam.id, this.handleAsteroidHit);
            }
        }
    }

    private handleLaserBeamHitShipAndEmit = (laserBeam: DrawableLaserBeam, ship: DrawableShip): void => {
        this.laserBeams.delete(laserBeam.id);
        const laserBeamWasFiredByThisShip = this.ship?.id === laserBeam.fromShipId;
        if (laserBeamWasFiredByThisShip) {
            this.eventEmitter.shipDamaged(this.handleShipDamage, {laserBeamId: laserBeam.id});
        }
    }

    public handleAsteroidHit = (asteroidDTO1: AsteroidDTO, asteroidDTO2: AsteroidDTO) => {
        this.registerObjects([asteroidDTO1, asteroidDTO2], this.asteroids, this.createAsteroid);
    }

    public onAsteroidFinishedExploding = (asteroid: DrawableAsteroid) => {
        this.asteroids.delete(asteroid.id);
        this.addGem({
            ...asteroid,
            points: asteroid.gemPoints
        });
    }

    public moveShip = (object: ShipDTO) => {
        const mapShip = this.ships.get(object.id);
        if (mapShip) {
            mapShip.update(object);
        } else {
            this.ships.set(object.id, this.createShip(object));
        }
    }

    public moveShips = (objects: ShipDTO[]) => {
        for (const ship of objects) {
            this.moveShip(ship);
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

    public handleShipDamage = (shipId: string, healthPoints: number, livesLeft: number) => {
        const ship = this.ships.get(shipId);
        if (ship) {
            ship.lives = livesLeft;
            ship.healthPoints = healthPoints;

            if (livesLeft <= 0) {
                this.ships.delete(shipId);
                this.addAlert(`${ship.name} died!`);
            }
        }
    }

    public handleUserLeft = (userId: string, message: string) => {
        this.alerts.push(message);
        this.ships.delete(userId);
    }

    public handleUserJoined = (nickname: string) => {
        this.alerts.push(`${nickname} has joined`);
    };

    public handleShipExploded = (shipId: string, shipLives: number, laserBeamId?: string) => {
        const ship = this.ships.get(shipId);
        if (ship ) {
            ship.lives = shipLives;
            if (shipId !== this.ship?.id) {
                ship.explode();
            }
        }
        if (laserBeamId) {
            this.laserBeams.delete(laserBeamId);
        }
    }

    public handleShipPickedUpGemAndEmit = (shipId: string, gem: DrawableGem) => {
        this.gems.delete(gem.id);
        this.eventEmitter.shipPickedUpGem(shipId, gem.id, this.handleShipPickedUpGem);
    }

    public handleShipPickedUpGem = (shipId: string, gemId: string, shipPoints: number) => {
        const matchingShip = this.ships.get(shipId);
        if (matchingShip) {
            matchingShip.points = shipPoints;
        }
        this.gems.delete(gemId);
    };

    public addGem = (gem: GemDTO) => {
        console.log("add gem")
        this.registerObjects([gem], this.gems, this.createGem);
    }

    private createShip = (dto: ShipDTO) => {
        return new DrawableShip({
            ...dto,
            onFinishedExploding: (name: string) => {
                const expires = new Date();
                expires.setSeconds(expires.getSeconds() + ALERT_MESSAGE_DURATION);
                this.alerts.push(`${name} died!`);
            }
        });
    }

    private createPlayerShip = (ship: ShipDTO) => {
        if (!!this.ship) {
            throw new Error("Already have a player ship");
        }

        const playerShip = new PlayerShip(
            {
                ...ship,
                onFinishedExploding: () => {
                    this.alerts.push(`You died!`);
                }
            },
            (laserBeam: LaserBeamDTO) => {
                this.laserBeams.set(laserBeam.id, this.createLaserBeam(laserBeam));
                this.eventEmitter.fireLaserBeam(laserBeam);
            },
        );

        this.ships.set(playerShip.id, playerShip);

        return playerShip;
    }

    private createAsteroid = (dto: AsteroidDTO) => {
        return new DrawableAsteroid({
            ...dto,
            eventEmitter: this.eventEmitter,
            onFinishedExploding: this.onAsteroidFinishedExploding,
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