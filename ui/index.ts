import { v4 as uuidv4 } from 'uuid';
import './style.css';
import { Renderer } from "./renderer";
import { io, Socket } from 'socket.io-client';
import { createForm } from './form';

const appEl = document.getElementById("app") as HTMLDivElement;
const port = PORT ? `:${PORT}` : "";
const url = `${HOST || "localhost"}${port}`;

if (!appEl) {
  throw new Error("No app element found ")
} else {
  const renderer = new Renderer(appEl);
  let socket: Socket | undefined;

  const startGame = async (nickName: string) => {
    socket = io(`${PROTOCOL}://${url}`, { auth: {name: nickName, id: uuidv4()}});
    socket.on("hello", (arg: string) => {
      console.log("received hello message with arg:", arg); // world
    });
    await renderer.pollUntilReady();
    renderer.animate();
  };

  createForm(appEl, startGame);
}

