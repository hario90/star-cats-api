import { Socket } from "socket.io";
import { Ship } from "../../shared/objects/ship";
import { generateRandomShip } from "../utils/game-object-utils";
import { SocketAuth, ShipModelNum, EnemyShipColor, ShipDTO, GameEventType, ShipDamageArgs } from "../../shared/types";
import { GameObjectManager } from "./game-object-manager";

// TODO: reducer?
export class ShipManager extends GameObjectManager<Ship, ShipDTO> {
    private evilShips = new Set<string>();
    private shipToEvilShips = new Map<string, Set<string>>();

    constructor(roomId: string) {
        super(roomId, GameEventType.ShipMoved);
        this.setUpShips = this.setUpShips.bind(this);
        this.setUpEvilShips = this.setUpEvilShips.bind(this);
        this.getShipById = this.getShipById.bind(this);
        this.handleShipDamaged = this.handleShipDamaged.bind(this);
        this.handleShipDied = this.handleShipDied.bind(this);
        this.handleShipExploded = this.handleShipExploded.bind(this);
        this.handleShipPickedUpGem = this.handleShipPickedUpGem.bind(this);
    }

    public setUpShips(socket: Socket) {
        const userId = socket.id;
        const { name, shipColor, modelNum } = socket.handshake.auth as SocketAuth;

        // TODO don't put ship on asteroids
        const ship = generateRandomShip({
            name,
            id: userId,
            speed: 1,
            userControlled: true,
            modelNum,
            color: shipColor,
        });
        this.objects.set(userId, ship);
    }

    public getShipById(
        shipId: string, 
       ): Ship | undefined {
        return this.objects.get(shipId);
    }

    public handleShipDamaged(
        socket: Socket,
        reduceBy: number,
        shipIdThatGotHit: string,
        onShipDamage: (
            shipId: string,
            healthPoints: number,
            lives: number,
            evilShipsToRemove: string[]
        ) => void
    ) {
        const ship = this.getShipById(shipIdThatGotHit);
        
        if (ship) {
            console.log("reducing ships health points by " + reduceBy);
            ship.reduceHealthPoints(reduceBy);
            let evilShipsToRemove: string[] = [];

            if (ship.lives <= 0) {
                console.log(
                    "no more lives left",
                    socket.id + " " + ship.id
                );
                evilShipsToRemove = Array.from(
                    this.shipToEvilShips.get(ship.id) ?? []
                );
                this.handleShipDied(socket, ship.id, ship.name);
                // TODO disconnect because game over
            }

            onShipDamage(
                shipIdThatGotHit,
                ship.healthPoints,
                ship.lives,
                evilShipsToRemove
            );
            socket.to(this.roomId).emit(
                GameEventType.ShipDamage,
                shipIdThatGotHit,
                ship.healthPoints,
                ship.lives,
                evilShipsToRemove
            );
        }
    }

    public handleShipExploded(
        socket: Socket,
        shipId: string,
        laserBeamId: string,
        shipExploded: (
            shipId: string,
            lives: number,
            laserBeamId?: string
        ) => void
    ): void {
        console.log(`Ship ${shipId} exploded.`);
        const ship = this.objects.get(shipId);
        if (ship) {
            ship.lives--;
            if (ship.lives <= 0) {
                this.objects.delete(shipId);
            }

            shipExploded(shipId, ship.lives, laserBeamId);
            socket.to(this.roomId).emit(
                GameEventType.ShipExploded,
                shipId,
                ship.lives,
                laserBeamId
            );
        }
    }

    public handleShipDied(socket: Socket, userId: string, name: string) {
        this.objects.delete(userId);
        for (const evilShipId of this.evilShips) {
            this.objects.delete(evilShipId);
            this.shipToEvilShips.delete(userId);
        }
        const message = `${name} ran out of lives!`;
        socket.to(this.roomId).emit(GameEventType.UserLeft, userId, message);
    };

    public handleShipPickedUpGem(
        socket: Socket, 
        shipId: string,
        gemId: string,
        gemPoints: number,
        cb: (shipId: string, gemId: string, shipPoints: number) => void
    ) {
        const matchingShip = this.objects.get(shipId);
        if (matchingShip) {
            matchingShip.points += gemPoints;
            cb(shipId, gemId, matchingShip.points);
            socket.to(this.roomId).emit(
                GameEventType.ShipPickedUpGem,
                shipId,
                gemId,
                matchingShip.points
            );
        }
    }

    private setUpEvilShips(socket: Socket): void {
        const { allowRobots = false } = socket.handshake.auth as SocketAuth;
        const evilShipIds = new Set<string>();
        if (allowRobots) {
            for (let i = 0; i < 8; i++) {
                const evilShip = generateRandomShip({
                    name: `Mr. Evil ${i + 1}`,
                    targetId: socket.id,
                    modelNum: ShipModelNum.One, // todo randomize
                    color: EnemyShipColor.Black, // todo randomize
                });
                this.evilShips.add(evilShip.id);
                this.objects.set(evilShip.id, evilShip);
                evilShipIds.add(evilShip.id);
            }
        }

        this.shipToEvilShips.set(socket.id, evilShipIds);
    }
}