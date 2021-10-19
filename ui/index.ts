import { io } from 'socket.io-client';
import './style.css';
import { Renderer } from "./renderer";
import { createForm } from './form';
import { SERVER_URL } from './constants';

const appEl = (document.getElementById("app") as HTMLDivElement)
 || document.createElement("div");


const startGame = async (nickName: string) => {
  const socket = io(SERVER_URL, {
    auth: {
      name: nickName,
      canvasHeight: document.body.clientHeight,
      canvasWidth: document.body.clientWidth,
    },
    transports: ["websocket"]
  });

  const renderer = new Renderer(appEl, socket, nickName);
  await renderer.pollUntilReady();
  renderer.animate();
};

createForm(appEl, startGame);
