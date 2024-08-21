import { Socket } from "socket.io";

import { createInitialObjects, mapToJSONList } from "../utils/game-object-utils";
import { Gem } from "../../shared/objects/gem";
import { ErrorCode } from "../constants";
import { AsteroidDTO, GameEventType, GemDTO, LaserBeamDTO, ShipDTO, ShipDamageArgs, ShipModelNum, SocketAuth } from "../../shared/types";
import { Planet } from "../../shared/objects/planet";
import { ShipManager } from "./ship-manager";
import { LaserBeamManager } from "./laser-manager";
import { AsteroidManager } from "./asteroid-manager";

const MAX_TEAM_SIZE = 3;
const MAX_NUM_TEAMS = 4;
const MAX_ROOM_SIZE = MAX_NUM_TEAMS * MAX_TEAM_SIZE;
export class GameRoom {
    private shipManager: ShipManager = new ShipManager(this.roomId);
    private asteroidManager: AsteroidManager = new AsteroidManager(this.roomId);
    private laserBeamManager = new LaserBeamManager(this.roomId);
    private gems = new Map<string, Gem>();
    private planets = new Map<string, Planet>();
    private players = new Map<string, Socket>();

    constructor(private roomId: string) {
        console.log(`Game room created with id ${roomId}`);
        const { asteroids } = createInitialObjects();
        this.asteroidManager.initialize(asteroids);
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
            mapToJSONList(this.asteroidManager.getObjects()),
            mapToJSONList(this.laserBeamManager.getObjects()),
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
            this.laserBeamManager.handleObjectMoved(socket, obj);
        });
        socket.on(GameEventType.AsteroidMoved, (obj: AsteroidDTO) => {
            this.asteroidManager.handleObjectMoved(socket, obj);
        });
        socket.on(GameEventType.EmitLaserBeam, (laserBeam: LaserBeamDTO) => {
            this.laserBeamManager.handleLaserBeamEmitted(socket, laserBeam);
        });
        socket.on(GameEventType.DeleteLaserBeam, (id: string) => {
            this.laserBeamManager.deleteObjectById(id);
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
                    this.laserBeamManager.deleteObjectById(laserBeamId);
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

                // Gem has same id as asteroid
                const gem = new Gem({
                    ...asteroid,
                    points: asteroid.gemPoints,
                });
                this.asteroidManager.deleteObjectById(asteroid.id);
                this.gems.set(gem.id, gem);

                this.laserBeamManager.deleteObjectById(laserBeamId);

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
                this.laserBeamManager.deleteObjectById(laserBeamId);
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
                this.laserBeamManager.deleteObjectById(laserBeamId);
                this.asteroidManager.handleAsteroidHit(socket, asteroid, cb);
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