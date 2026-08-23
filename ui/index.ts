import { io } from "socket.io-client";
import "./style.css";
import { Renderer } from "./game-engine/renderer";
import { createForm } from "./form";
import { SERVER_URL } from "./constants";
import { PlayerShipColor, ShipModelNum } from "../shared/types";
import { getRandomInt } from "../shared/util";
import { ManagerOptions } from "socket.io-client";
import { SocketOptions } from "socket.io-client";

const getRandomColor = (): PlayerShipColor => {
    const num = getRandomInt(1, 4);
    switch (num) {
        case 1:
            return PlayerShipColor.Green;
        case 2:
            return PlayerShipColor.Orange;
        case 3:
            return PlayerShipColor.Red;
        default:
            return PlayerShipColor.Blue;
    }
};

const getRandomModel = (): ShipModelNum => {
    const num = getRandomInt(1, 3);
    switch (num) {
        case 1:
            return ShipModelNum.One;
        case 2:
            return ShipModelNum.Two;
        default:
            return ShipModelNum.Three;
    }
};

const appEl =
    (document.getElementById("app") as HTMLDivElement) ||
    document.createElement("div");

const startGame = async (nickName: string, allowRobots = true) => {
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
        auth: {
            name: nickName,
            shipColor: getRandomColor(),
            modelNum: getRandomModel(),
            allowRobots
        },
        transports: ["websocket"],
    };
    const socket = process.env.NODE_ENV === "production" ? io(socketOptions) : io(SERVER_URL, socketOptions);

    const renderer = new Renderer(appEl, socket);
    await renderer.pollUntilReady();
    renderer.animate();
};

createForm(appEl, startGame);
