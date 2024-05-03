import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";

import { createInitialObjects, mapToJSONList } from "../utils/game-object-utils";
import { Asteroid } from "../../shared/objects/asteroid";
import { LaserBeam } from "../../shared/objects/laser-beam";
import { Gem } from "../../shared/objects/gem";
import { ErrorCode } from "../constants";
import { AsteroidDTO, GameEventType, GemDTO, LaserBeamDTO, ShipDTO, ShipDamageArgs, ShipModelNum, SocketAuth } from "../../shared/types";
import { Planet } from "../../shared/objects/planet";
import { ShipManager } from "./ship-manager";

const MAX_TEAM_SIZE = 3;
const MAX_NUM_TEAMS = 4;
const MAX_ROOM_SIZE = MAX_NUM_TEAMS * MAX_TEAM_SIZE;
export class GameRoom {
    private shipManager: ShipManager = new ShipManager(this.roomId);
    private asteroids: Map<string, Asteroid>;
    private laserBeams = new Map<string, LaserBeam>();
    private gems = new Map<string, Gem>();
    private planets = new Map<string, Planet>();
    private players = new Map<string, Socket>();

    constructor(private roomId: string) {
        const { asteroids } = createInitialObjects();
        this.asteroids = asteroids;
        this.addPlayer = this.addPlayer.bind(this);
        this.setUpGameObjects = this.setUpGameObjects.bind(this);
        this.setUpSocketEvents = this.setUpSocketEvents.bind(this);
    }

    public addPlayer(socket: Socket): void {
        const userId = socket.id;
        if (this.players.has(userId)) {
            console.warn(`User ${userId} already in game room.`);
            return;
        }

        if (this.players.size >= MAX_ROOM_SIZE) {
            throw new Error(ErrorCode.ROOM_FULL);
        }

        this.players.set(userId, socket);
        socket.join(this.roomId);
        this.setUpGameObjects(socket);
        this.setUpSocketEvents(socket);
    }
    
    private setUpGameObjects(socket: Socket): void {
        const userId = socket.id;
        const { name } = socket.handshake.auth as SocketAuth;

        this.shipManager.setUpShips(socket);
        
        socket.emit(
            GameEventType.GetInitialObjects,
            mapToJSONList(this.shipManager.getObjects()),
            mapToJSONList(this.asteroids),
            mapToJSONList(this.laserBeams),
            mapToJSONList(this.gems),
            mapToJSONList(this.planets)
        );
        socket.to(this.roomId).emit(GameEventType.UserJoined, name);
        console.log(`user ${name}, id ${userId} has joined`);
    }

    private setUpSocketEvents(socket: Socket): void {
        socket.on(GameEventType.ShipMoved, (obj: ShipDTO) => {
            this.shipManager.handleObjectMoved(socket, obj);
        });
        socket.on(GameEventType.LaserMoved, (obj: LaserBeamDTO) => {
            const matchingLaserBeam = this.laserBeams.get(obj.id);
            if (matchingLaserBeam) {
                matchingLaserBeam.move(obj);
                socket.to(this.roomId).emit(
                    GameEventType.LaserMoved,
                    matchingLaserBeam.toDTO()
                );
            } else {
                this.laserBeams.set(obj.id, new LaserBeam(obj));
            }
        });
        socket.on(GameEventType.AsteroidMoved, (obj: AsteroidDTO) => {
            const matchingAsteroid = this.asteroids.get(obj.id);
            if (matchingAsteroid) {
                matchingAsteroid.move(obj);
                socket.to(this.roomId).emit(
                    GameEventType.AsteroidMoved,
                    matchingAsteroid.toDTO()
                );
            } else {
                this.asteroids.set(obj.id, new Asteroid(obj));
            }
        });
        socket.on(GameEventType.EmitLaserBeam, (laserBeam: LaserBeamDTO) => {
            this.laserBeams.set(laserBeam.id, new LaserBeam(laserBeam));
            socket.to(this.roomId).emit(GameEventType.LaserMoved, laserBeam);
        });
        socket.on(GameEventType.DeleteLaserBeam, (id: string) => {
            this.laserBeams.delete(id);
        });
        socket.on(
            GameEventType.ShipDamage,
            (
                shipIdThatGotHit: string,
                shipDamageArgs: ShipDamageArgs,
                onShipDamage: (
                    shipId: string,
                    healthPoints: number,
                    lives: number,
                    evilShipsToRemove: string[]
                ) => void
            ) => {
                const ship = this.shipManager.getShipById(shipIdThatGotHit);
                if (!ship) {
                    return;
                }

                const {
                    laserBeamId,
                    asteroidId,
                    shipId: otherShipId,
                } = shipDamageArgs;

                let reduceBy = 0;
                if (laserBeamId) {
                    this.laserBeams.delete(laserBeamId);
                    reduceBy = 1;
                } else if (asteroidId || otherShipId) {
                    reduceBy = ship.healthPoints;
                }

                console.log("reduceBy " + reduceBy);

                if (!onShipDamage) {
                    console.error("onShipDamage not defined");
                    return;
                }

                this.shipManager.handleShipDamaged(socket, reduceBy, shipIdThatGotHit, onShipDamage);
            }
        );
        socket.on(
            GameEventType.AsteroidExploded,
            (
                asteroid: AsteroidDTO,
                laserBeamId: string,
                addGem: (gem: GemDTO) => void
            ) => {
                console.log("asteroid exploded");
                if (!this.asteroids.has(asteroid.id)) {
                    console.log("asteroid not found");
                    return;
                }

                // Gem has same id as asteroid
                const gem = new Gem({
                    ...asteroid,
                    points: asteroid.gemPoints,
                });
                this.asteroids.delete(asteroid.id);
                this.gems.set(gem.id, gem);

                this.laserBeams.delete(laserBeamId);

                // Keep event sender in sync with rest of the clients
                addGem(gem.toDTO());
                console.log("broadcasting add gem");
                socket.to(this.roomId).emit(GameEventType.AddGem, gem.toDTO());
            }
        );
        socket.on(
            GameEventType.ShipExploded,
            (
                shipId: string,
                laserBeamId: string,
                shipExploded: (
                    shipId: string,
                    lives: number,
                    laserBeamId?: string
                ) => void
            ) => {
                this.shipManager.handleShipExploded(socket, shipId, laserBeamId, shipExploded)
                this.laserBeams.delete(laserBeamId);
            }
        );
        socket.on(
            GameEventType.ShipPickedUpGem,
            (
                shipId: string,
                gemId: string,
                cb: (shipId: string, gemId: string, shipPoints: number) => void
            ) => {
                console.log("ship picked up gem");
                const matchingGem = this.gems.get(gemId);
                console.log("matching gem", matchingGem);
                if (matchingGem) {
                    this.shipManager.handleShipPickedUpGem(socket, shipId, gemId, matchingGem.points, cb);
                    this.gems.delete(gemId);
                }
            }
        );
        socket.on(
            GameEventType.AsteroidHit,
            (
                asteroid: AsteroidDTO,
                laserBeamId: string,
                cb: (a1: AsteroidDTO, a2: AsteroidDTO) => void
            ) => {
                const matchingAsteroid = this.asteroids.get(asteroid.id);
                console.log("asteroid hit");
                if (!matchingAsteroid) {
                    console.log("could not find matching asteroid");
                    return;
                }

                this.asteroids.delete(asteroid.id);
                this.laserBeams.delete(laserBeamId);

                // split asteroid into 2 asteroids half the original size, 180 deg apart
                const radius = Math.round(asteroid.width / 2);
                const nextPos1 = matchingAsteroid.getNextPosition(
                    Math.floor(radius / 2)
                );
                const nextPos2 = matchingAsteroid.getNextPosition(
                    Math.floor(radius / 2),
                    asteroid.deg + 180
                );
                const speed = 0.5;
                const a1 = {
                    ...asteroid,
                    speed,
                    id: uuidV4(),
                    width: radius,
                    height: radius,
                    x: nextPos1[0],
                    y: nextPos1[1],
                };
                const a2 = {
                    ...asteroid,
                    speed,
                    id: uuidV4(),
                    width: radius,
                    height: radius,
                    x: nextPos2[0],
                    y: nextPos2[1],
                    deg: asteroid.deg + 180,
                };

                this.asteroids.set(a1.id, new Asteroid(a1));
                this.asteroids.set(a2.id, new Asteroid(a2));

                cb(a1, a2);
                socket.to(this.roomId).emit(GameEventType.AsteroidHit, a1, a2);
            }
        );
        socket.on("disconnect", (reason: string) => {
            const { name } = socket.handshake.auth as SocketAuth;
            console.log(
                `user ${name}, id ${socket.id} has disconnected. Reason: ${reason}`
            );
            this.shipManager.handleShipDied(socket, socket.id, name);
        });
    }

}