import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { GameEventType, PositionInfo, SocketAuth } from "../../shared/types";
import { Ship } from "../objects/ship";

export function createWebSocket(server: HttpServer) {
    const ships: Ship[] = [];
    const io = new Server(server);
    const shipToIndex = new Map<string, number>();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const name = socket.handshake.auth.name;
      const ship = new Ship(name, socket.id);
      ships.push(ship);
      socket.broadcast.emit(GameEventType.Ships, ships);
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${socket.id} has joined`);
      shipToIndex.set(socket.id, ships.length - 1);
      next();
    });
    io.on("connection", (socket: Socket) => {
      console.log("connection")
      const { name } = socket.handshake.auth as SocketAuth;

      socket.on(GameEventType.ShipMoved, (positionInfo: PositionInfo) => {
        const index = shipToIndex.get(socket.id);
        if (index !== undefined && index > -1 && index < ships.length) {
          const ship = ships[index];
          ship.move(positionInfo);
        }
        socket.broadcast.emit(GameEventType.Ships, ships);
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${socket.id} has disconnected. Reason: ${reason}`);
        const index = shipToIndex.get(socket.id);
        if (index !== undefined) {
          ships.splice(index, 1);
        }
        socket.broadcast.emit(GameEventType.UserLeft, name)
        // user left
        // ship took damage
        // ship is dying
        // ship exploded
        //
        socket.broadcast.emit(GameEventType.Ships, ships);
      });
    });
}
