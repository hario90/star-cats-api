import './style.css';
import { Renderer } from "./renderer";
import { io } from 'socket.io-client';


const renderer = new Renderer();
const port = PORT ? `:${PORT}` : "";
const url = `${HOST || "localhost"}${port}`;
const socket = io(`${PROTOCOL}://${url}`);

(async () => {
  socket.on("hello", (arg: string) => {
    console.log("received hello message with arg:", arg); // world
  });

  await renderer.pollUntilReady();
  renderer.animate();
})();

