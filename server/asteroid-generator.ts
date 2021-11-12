import { v4 as uuid } from "uuid";

import { BOARD_WIDTH, BOARD_HEIGHT, halfShipHeight } from "../shared/constants";
import { isOverlappingWithSection } from "../shared/util";
import { Asteroid } from "../shared/objects/asteroid";

const MAX_ASTEROID_SPEED = 15;
const MAX_ASTEROID_HEIGHT = 100;
const MIN_ASTEROID_HEIGHT = halfShipHeight * 2;

export class AsteroidGenerator {
    constructor() {}

    getRandomX() {
        return Math.random() * BOARD_WIDTH;
    }

    getRandomY() {
        return Math.random() * BOARD_HEIGHT;
    }

    isInbounds(asteroid: Asteroid) {
        return asteroid.minX >= 0 && asteroid.maxX <= BOARD_WIDTH && asteroid.minY >= 0 && asteroid.maxY <= BOARD_HEIGHT;
    }

    isOverlappingWithOtherAsteroids(asteroid: Asteroid, others: Asteroid[]): boolean {
        let isOverlapping = false;
        for (const other of others) {
            if (isOverlappingWithSection(asteroid, other)) {
                isOverlapping = true;
                break;
            }
        }
        return isOverlapping;
    }

    isValid(asteroid: Asteroid, others: Asteroid[]): boolean {
        return this.isInbounds(asteroid) && !this.isOverlappingWithOtherAsteroids(asteroid, others);
    }

    random(isMoving: boolean, otherAsteroids: Asteroid[]): Asteroid | undefined {
        let x = this.getRandomX();
        let y = this.getRandomY();
        const speed = isMoving ? Math.random() * MAX_ASTEROID_SPEED : 0;
        const height = Math.random() * MAX_ASTEROID_HEIGHT + MIN_ASTEROID_HEIGHT;
        const width = height;
        const id = uuid();

        let tries = 10;
        let asteroid = new Asteroid(
            id, x, y, height, width, speed, 0
        );
        while (tries > 0 && !this.isValid(asteroid, otherAsteroids)) {
            x = this.getRandomX();
            y = this.getRandomY();
            asteroid = new Asteroid(id, x, y, height, width, speed, 0);
            tries--;
        }
        return this.isValid(asteroid, otherAsteroids) ? asteroid : undefined;
    }
}