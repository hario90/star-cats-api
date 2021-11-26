import { io } from 'socket.io-client';
import './style.css';
import { Renderer } from "./game-engine/renderer";
import { createForm } from './form';
import { SERVER_URL } from './constants';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants';

const appEl = (document.getElementById("app") as HTMLDivElement)
 || document.createElement("div");


const startGame = async (nickName: string) => {
  const x = Math.random() * BOARD_WIDTH;
  const y = Math.random() * BOARD_HEIGHT;
  const socket = io(SERVER_URL, {
    auth: {
      name: nickName,
      x,
      y
    },
    transports: ["websocket"]
  });

  const renderer = new Renderer(appEl, socket, nickName, x, y);
  await renderer.pollUntilReady();
  renderer.animate();
};

createForm(appEl, startGame);
