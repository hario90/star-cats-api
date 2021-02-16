import { io } from 'socket.io-client';
import { v4 as uuid } from "uuid";
import './style.css';
import { Renderer } from "./renderer";
import { createForm } from './form';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../shared/constants';
import { PlayerShip } from './objects/player-ship';
import { SERVER_URL } from './constants';

const appEl = (document.getElementById("app") as HTMLDivElement)
 || document.createElement("div");


const startGame = async (nickName: string) => {
  const userId = uuid();
  const socket = io(SERVER_URL, {
    auth: {
      userId,
      name: nickName,
      canvasHeight: document.body.clientHeight,
      canvasWidth: document.body.clientWidth,
    },
  });

  const ship = new PlayerShip(Math.random() * BOARD_WIDTH, Math.random() * BOARD_HEIGHT, nickName, userId);
  const renderer = new Renderer(appEl, socket, ship);
  await renderer.pollUntilReady();
  renderer.animate();
};

createForm(appEl, startGame);
