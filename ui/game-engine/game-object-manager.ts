import { Socket } from "socket.io-client";
import { BOARD_HEIGHT, BOARD_WIDTH, MIN_ASTEROID_HEIGHT } from "../../shared/constants";
import { Asteroid } from "../../shared/objects/asteroid";
import { Ship } from "../../shared/objects/ship";
import { LaserBeamDTO, GemDTO, ShipDTO, AsteroidDTO, GameObjectType, GameEventType } from "../../shared/types";
import { distanceBetweenObjects, getDegBetweenObjects, isOverlapping } from "../../shared/util";
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
const DISTANCE_EVIL_SHIP_STARTS_SHOOTING = 300;
const SHOOTING_FREQUENCY = 30;

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
    private evilShips: Set<string> = new Set();

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
        console.log("receive initial objects")
        this.ships.clear();
        this.asteroids.clear();
        this.laserBeams.clear();
        this.gems.clear();
        const playerShipDTO = ships.find((s) => s.id === this.socket.id);
        if (playerShipDTO) {
            this.ship = this.createPlayerShip(playerShipDTO);
        } else {
            throw new Error("Where is the main player's ship?")
        }

        const otherShipDTOs = [];
        this.evilShips = new Set();
        for (const ship of ships) {
            if (ship.id !== this.socket.id) {
                otherShipDTOs.push(ship)
            }
            if (!ship.userControlled) {
                this.evilShips.add(ship.id);
            }
        }
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

    private isEvilShipControlledByMe = (gameObject: DrawableObject) => {
        return isDrawableShip(gameObject) && !gameObject.userControlled && gameObject.targetId === this.ship?.id;
    }

    public getObjectNextPositionAndEmit = (gameObject: DrawableObject): [number, number] => {
        let x = gameObject.x;
        let y = gameObject.y;
        if (gameObject.isDead) {
            return [x, y];
        }

        const prevSections = new Map(gameObject.sections);
        if (isDrawableShip(gameObject) && this.isEvilShipControlledByMe(gameObject)) {
            const deg = this.getEvilShipNextDeg(gameObject);
            if (deg !== undefined) {
                gameObject.deg = deg;
            }
        }

        const [nextX, nextY] = gameObject.getNextPosition();

        x = nextX;
        y = nextY;

        gameObject.update({...gameObject.toDTO(), x, y});

        const emitType = GAME_OBJECT_TYPE_TO_EMIT_TYPE.get(gameObject.type);
        if (emitType) {
            this.eventEmitter.gameObjectMoved(emitType.move, gameObject);
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
            const radius = gameObject.getRadius();
            if (x - radius <= 0 || x + radius >= BOARD_WIDTH || y - radius <= 0 || y + radius >= BOARD_HEIGHT) {
                gameObject.isDead = true;
                const laserBeamId = gameObject.id;
                this.laserBeams.delete(laserBeamId);
                if (gameObject.fromShipId === this.ship?.id) {

                    this.eventEmitter.deleteLaserBeam(laserBeamId);
                }
                return [x, y];
            }
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
            this.eventEmitter.shipDamaged(ship.id, this.handleShipDamage, {asteroidId: asteroid.id});
        }
    }

    private handleShipHitShip = (ship1: DrawableShip, ship2: DrawableShip) => {
        ship1.explode();
        ship2.explode();
        if (ship1.isMainShip) {
            this.eventEmitter.shipDamaged(ship1.id, this.handleShipDamage, {shipId: ship2.id});
        } else if (ship2.isMainShip) {
            this.eventEmitter.shipDamaged(ship2.id, this.handleShipDamage, {shipId: ship1.id});
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
        ship.onHit();
        if (ship.healthPoints === 1) {
            ship.explode();
        }
        this.laserBeams.delete(laserBeam.id);
        const shipThatFiredLaserBeam = this.ships.get(laserBeam.fromShipId);
        if (shipThatFiredLaserBeam) {
            const laserBeamFiredByMyEnemyShip = this.isEvilShipControlledByMe(shipThatFiredLaserBeam);
            const laserBeamWasFiredByThisShip = this.ship?.id === laserBeam.fromShipId;
            if (laserBeamWasFiredByThisShip || laserBeamFiredByMyEnemyShip) {
                console.log("emitting ship damaged")
                this.eventEmitter.shipDamaged(ship.id, this.handleShipDamage, {laserBeamId: laserBeam.id});
            }
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
            console.log("ship doesn't exist. creating new ship", object)
            this.ships.set(object.id, this.createShip(object));
        }
    }

    public getEvilShipNextDeg = (evilShip: DrawableShip): number | undefined => {
         // adding 90 b/c the ship image starts rotated 90 deg counter-clockwise from the x-axis
        // and so when the image is drawn, we subtract 90 degrees
        if (!this.ship) {
            return;
        }

        const distanceBetweenShips = Math.floor(distanceBetweenObjects(evilShip, this.ship));
        if (distanceBetweenShips <= DISTANCE_EVIL_SHIP_STARTS_SHOOTING && distanceBetweenShips % SHOOTING_FREQUENCY === 0) {
            evilShip.shoot();
        }
        return getDegBetweenObjects(evilShip, this.ship) + 90;
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

    public handleShipDamage = (shipId: string, healthPoints: number, livesLeft: number, evilShipsToRemove: string[]) => {
        console.log("handle ship damage. hp", healthPoints)
        const ship = this.ships.get(shipId);
        if (ship) {
            ship.lives = livesLeft;
            ship.healthPoints = healthPoints;

            if (livesLeft <= 0) {
                this.ships.delete(shipId);
                this.ship?.handleShipDied();
                if (ship.userControlled) {
                    this.addAlert(`${ship.name} died!`);
                }
            }
        }

        console.log("evilShipsToRemove", evilShipsToRemove)
        for (const evilShipId of evilShipsToRemove) {
            this.ships.delete(evilShipId);
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
                if (dto.userControlled) {
                    this.alerts.push(`${name} died!`);
                }
            },
            onShoot: this.onShoot,
        });
    }

    private onShoot = (laserBeam: LaserBeamDTO) => {
        this.laserBeams.set(laserBeam.id, this.createLaserBeam(laserBeam));
        this.eventEmitter.fireLaserBeam(laserBeam);
    };

    private createPlayerShip = (ship: ShipDTO) => {
        if (!!this.ship) {
            throw new Error("Already have a player ship");
        }

        const playerShip = new PlayerShip(
            {
                ...ship,
                onFinishedExploding: () => {
                    this.alerts.push(`You died!`);
                },
                onShoot: this.onShoot
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