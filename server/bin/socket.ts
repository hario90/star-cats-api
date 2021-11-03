import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { GameEventType, PositionInfo, SocketAuth } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";
import { Ship } from "../objects/ship";


function createInitialObjects() {
  const asteroids = [];
  const asteroidGenerator = new AsteroidGenerator();
  for (let i = 0; i < 15; i++) {
    const asteroid = asteroidGenerator.random(false);
    asteroids.push(asteroid);
  }
  return {asteroids};
}

export function createWebSocket(server: HttpServer) {
    const ships: Ship[] = [];
    const io = new Server(server, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
      }
    });
    const shipToIndex = new Map<string, number>();
    const {asteroids} = createInitialObjects();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name } = socket.handshake.auth;
      const userId = socket.id;
      const ship = new Ship(name, userId);
      ships.push(ship);
      socket.emit(GameEventType.Ships, ships, asteroids);
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${userId} has joined`);
      shipToIndex.set(userId, ships.length - 1);
      next();
    });
    io.on("connection", (socket: Socket) => {
      const { name } = socket.handshake.auth as SocketAuth;
      const userId = socket.id;

      socket.on(GameEventType.ShipMoved, (positionInfo: PositionInfo) => {
        const index = shipToIndex.get(userId);
        if (index !== undefined && index > -1 && index < ships.length) {
          const ship = ships[index];
          ship.move(positionInfo);
          socket.broadcast.emit(GameEventType.ShipMoved, ship);
        }
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        const index = shipToIndex.get(userId);
        if (index !== undefined) {
          ships.splice(index, 1);
        }
        socket.broadcast.emit(GameEventType.UserLeft, userId, `${name} has left the game`)
      });
    });
}
