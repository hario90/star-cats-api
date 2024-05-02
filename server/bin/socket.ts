import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { addSocketToRoom } from "../models/room-tracker";

export function createWebSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket: Socket) => {
        try {
            const roomId = addSocketToRoom(socket);
            socket.emit("roomId", roomId);
        } catch (e) {
            console.error(`Disconnecting socket ${socket.id} due to error ${e?.message}`);
            socket.disconnect();
        }
    });
}
