import { io } from 'socket.io-client';
import './style.css';
import { Renderer } from "./renderer";
import { createForm } from './form';
import { BOARD_HEIGHT, BOARD_WIDTH, SERVER_URL } from './constants';
import { PlayerShip } from './objects/player-ship';

const appEl = (document.getElementById("app") as HTMLDivElement)
 || document.createElement("div");


const startGame = async (nickName: string) => {
  const socket = io(SERVER_URL, {
    auth: {
      name: nickName,
      canvasHeight: document.body.clientHeight,
      canvasWidth: document.body.clientWidth,
    },
  });

  const ship = new PlayerShip(Math.random() * BOARD_WIDTH, Math.random() * BOARD_HEIGHT, nickName, socket.id);
  const renderer = new Renderer(appEl, socket, ship);
  await renderer.pollUntilReady();
  renderer.animate();
};

createForm(appEl, startGame);
