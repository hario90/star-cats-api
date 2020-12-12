import './style.css';
import { Renderer } from "./renderer";

const renderer = new Renderer();

(async () => {
  await renderer.pollUntilReady();
  renderer.animate();
})();

