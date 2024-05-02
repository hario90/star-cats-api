import { Socket } from "socket.io";
import { ErrorCode } from "../constants";
import { GameRoom } from "./game-room";

// Store rooms in memory for now. Only allow up to 5 active rooms
const makeRoomId = (length: number, existingRoomIds: Set<string>) => {
    let result = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

const ID_LENGTH = 5;
const MAX_NUM_ROOMS = 3
const initialRoomId = makeRoomId(ID_LENGTH, new Set());
const ERROR = "Can't add socket to room";
export const rooms = {[initialRoomId]: new GameRoom(initialRoomId)};
export let openRoomId = initialRoomId;

export const addSocketToRoom = (socket: Socket) => {
    const openRoom: GameRoom = rooms[openRoomId];
    if (!openRoom) {
        throw new Error(`openRoomId ${openRoomId} wasn't found in rooms available!`);
    }

    try {
        openRoom.addPlayer(socket);
    } catch (e) {
        if (e.message === ErrorCode.ROOM_FULL) {
            if (Object.keys(rooms).length >= MAX_NUM_ROOMS) {
                console.error(`${ERROR}, no more rooms.`)
                throw new Error(ErrorCode.NO_MORE_ROOMS)
            }

            const nextRoomId = makeRoomId(ID_LENGTH, new Set(Object.keys(rooms)));
            rooms[nextRoomId] = new GameRoom(nextRoomId);
            openRoomId = nextRoomId;
            addSocketToRoom(socket);
        }
    }

    return openRoomId;
};
