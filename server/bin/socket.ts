import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { GameObject } from "../../shared/types";
import { Ship, ShipPositionInfo } from "../objects/ship";

const shipMap: Map<string, Ship> = new Map();

export function createWebSocket(server: HttpServer) {
    const io = new Server(server);
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    // Middleware that runs the first time the socket is connected
    // Here we add an entry to our map between socket id and ship reference
    io.use((socket: any, next: () => void) => {
        const nickname = socket.handshake.auth.name;
        socket.join("default room");
        // TODO create more rooms to handle load?
        console.log("nickname", nickname);
        shipMap.set(socket.id, new Ship(nickname, socket.id));
        next();
    });

    io.on("connection", (socket: any) => {
        // TODO throttle
        const id = socket.id;
        const { name, canvasHeight, canvasWidth } = socket.handshake.auth;
        const ship = shipMap.get(id) || new Ship(name, socket.id);
        let lastEmitted = new Set<GameObject>();
        socket.on("shipMoved", (positionInfo: ShipPositionInfo) => {
            ship.move(positionInfo)
            shipMap.set(id, ship);
            let { nearby, changed, objectSet } = getNearbyObjects(socket.id, ship.x, ship.y, canvasHeight, canvasWidth, lastEmitted)
            lastEmitted = objectSet;
            if (changed) {
              socket.emit("objects", nearby);
            }
        });
    });
}

const getNearbyObjects = (id: string, x: number, y: number,
    canvasHeight: number, canvasWidth: number, prevObjects: Set<GameObject>): { nearby: GameObject[], changed: boolean, objectSet: Set<GameObject> } => {
    const halfWidth = Math.floor(canvasWidth / 2);
    const minX = x - halfWidth;
    const maxX = x + halfWidth;
    const halfHeight = Math.floor(canvasHeight / 2);
    const minY = y - halfHeight;
    const maxY = y + halfHeight;
    const objects: GameObject[] = [];
    const objectSet = new Set<GameObject>();
    let changed = false;

    for (const ship of shipMap.values()) {
      if (ship.socketId !== id && ship.x >= minX && ship.x <= maxX && ship.y >= minY, ship.y <= maxY) {
        objects.push(ship);
        objectSet.add(ship);
        if (!prevObjects.has(ship)) {
          changed = true;
        } else {
          prevObjects.delete(ship);
        }
      }
    }
    // An object is no longer in view
    if (prevObjects.size > 0) {
      changed = true;
    }
    return {
      changed,
      nearby: objects,
      objectSet,
    };
  };