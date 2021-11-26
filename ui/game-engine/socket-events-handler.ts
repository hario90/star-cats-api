import { Socket } from "socket.io-client";
import { Asteroid } from "../../shared/objects/asteroid";
import { Ship } from "../../shared/objects/ship";
import { AsteroidDTO, GameEventType, GameObjectDTO, GemDTO, isAsteroidDTO, isLaserBeamDTO, isShipDTO, LaserBeamDTO, ShipDTO } from "../../shared/types";
import { DrawableAsteroid } from "../objects/drawable-asteroid";
import { DrawableGem } from "../objects/drawable-gem";
import { DrawableLaserBeam } from "../objects/drawable-laser-beam";
import { DrawableShip } from "../objects/drawable-ship";
import { cleanUpResources } from "../util";
import { GameObjectManager } from "./game-object-manager";

export class SocketEventHandler {
    private socket: Socket;
    private gameObjects: GameObjectManager;

    constructor(socket: Socket, gameObjects: GameObjectManager) {
        this.socket = socket;
        this.gameObjects = gameObjects;

        socket.on(GameEventType.Announce, this.addAlert);
        socket.on(GameEventType.GetInitialObjects, this.gameObjects.receiveInitialObjects);
        socket.on(GameEventType.ShipMoved, this.gameObjects.moveShip);
        socket.on(GameEventType.LaserMoved, this.gameObjects.moveLaserBeam);
        socket.on(GameEventType.AsteroidMoved, this.gameObjects.moveAsteroid);
        socket.on(GameEventType.AsteroidExploded, (asteroidId: string) => {})
        socket.on(GameEventType.UserLeft, this.gameObjects.handleUserLeft);
        socket.on(GameEventType.UserJoined, this.gameObjects.handleUserJoined);
        socket.on(GameEventType.ShipExploded, this.gameObjects.handleShipExploded);
        socket.on(GameEventType.ShipPickedUpGem, this.gameObjects.handleShipPickedUpGem);
        socket.on(GameEventType.AsteroidHit, this.gameObjects.handleAsteroidHit);
        socket.on(GameEventType.AddGems, this.gameObjects.addGems);
    }

    private addAlert = (message: string) => {
        this.gameObjects.addAlert(message);
    }
}