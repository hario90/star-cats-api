import { v4 as uuid } from "uuid";

import { BOARD_WIDTH, BOARD_HEIGHT } from "../shared/constants";
import { Asteroid } from "./objects/asteroid";

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
        return new Asteroid(
            uuid(), x, y, height, width, speed, deg
        );
    }
}