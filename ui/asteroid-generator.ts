import { Asteroid } from "./asteroid";
import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants";

const MAX_ASTEROID_SPEED = 15;
const MAX_ASTEROID_HEIGHT = 100;

export class AsteroidGenerator {
    constructor() {}

    // naive approach for now
    random(isMoving: boolean): Asteroid {
        const x = Math.random() * BOARD_WIDTH;
        const y = Math.random() * BOARD_HEIGHT;
        const speed = isMoving ? Math.random() * MAX_ASTEROID_SPEED : 0;
        const height = Math.random() * MAX_ASTEROID_HEIGHT;
        const width = height; // circular asteroids for now
        const deg = Math.random() * 360;
        return new Asteroid({
            x, y, speed, height, width, deg
        });
    }
}