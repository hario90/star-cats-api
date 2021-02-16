import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { GameEventType, PositionInfo, SocketAuth } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";
import { Ship } from "../objects/ship";


function createInitialObjects() {
  const asteroids = [];
  const asteroidGenerator = new AsteroidGenerator();
  for (let i = 0; i < 15; i++) {
    asteroids.push(asteroidGenerator.random(false));
  }

  return asteroids;
}
export function createWebSocket(server: HttpServer) {
    const ships: Ship[] = [];
    const io = new Server(server);
    const shipToIndex = new Map<string, number>();
    const asteroids = createInitialObjects();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name, userId } = socket.handshake.auth;
      const ship = new Ship(name, userId);
      ships.push(ship);
      socket.broadcast.emit(GameEventType.Ships, ships);
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${userId} has joined`);
      shipToIndex.set(userId, ships.length - 1);
      next();
    });
    io.on("connection", (socket: Socket) => {
      const { name, userId } = socket.handshake.auth as SocketAuth;

      socket.on(GameEventType.ShipMoved, (positionInfo: PositionInfo) => {
        const index = shipToIndex.get(userId);
        if (index !== undefined && index > -1 && index < ships.length) {
          const ship = ships[index];
          ship.move(positionInfo);
        }
        socket.broadcast.emit(GameEventType.Ships, ships, asteroids);
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        const index = shipToIndex.get(userId);
        if (index !== undefined) {
          ships.splice(index, 1);
        }
        socket.broadcast.emit(GameEventType.UserLeft, name)
        // user left
        // ship took damage
        // ship is dying
        // ship exploded
        //
        socket.broadcast.emit(GameEventType.Ships, ships, asteroids);
      });
    });
}
