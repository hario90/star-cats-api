import { v4 as uuid } from "uuid";

import { BOARD_WIDTH, BOARD_HEIGHT, MAX_ASTEROID_HEIGHT, MAX_ASTEROID_SPEED, MIN_ASTEROID_HEIGHT } from "../shared/constants";
import { isOverlappingWithSection } from "../shared/util";
import { Asteroid } from "../shared/objects/asteroid";
import { GameObjectType } from "../shared/types";

const BUFFER = 50 + 0.5 * MAX_ASTEROID_HEIGHT;
export class AsteroidGenerator {
    constructor() {}

    getRandomX() {
        return BUFFER + (Math.random() * (BOARD_WIDTH - BUFFER));
    }

    getRandomY() {
        return BUFFER + (Math.random() * (BOARD_HEIGHT - BUFFER));
    }

    getRandomDeg() {
        return Math.random() * 360;
    }

    getPoints() {
        const random = Math.random();
        let points = 1;
        if (random > 0.99) {
            points = 5;
        } else if (random > 0.95) {
            points = 4;
        } else if (random > 0.9) {
            points = 3;
        } else if (random > 0.85) {
            points = 2;
        }
        return points;
    }

    isInbounds(asteroid: Asteroid) {
        return asteroid.minX >= 0 && asteroid.maxX <= BOARD_WIDTH && asteroid.minY >= 0 && asteroid.maxY <= BOARD_HEIGHT;
    }

    isOverlappingWithOtherAsteroids(asteroid: Asteroid, others: Iterable<Asteroid>): boolean {
        let isOverlapping = false;
        for (const other of others) {
            if (isOverlappingWithSection(asteroid, other)) {
                isOverlapping = true;
                break;
            }
        }
        return isOverlapping;
    }

    isValid(asteroid: Asteroid, others: Iterable<Asteroid>): boolean {
        return this.isInbounds(asteroid) && !this.isOverlappingWithOtherAsteroids(asteroid, others);
    }

    random(isMoving: boolean, otherAsteroids: Iterable<Asteroid>): Asteroid | undefined {
        let x = this.getRandomX();
        let y = this.getRandomY();
        const speed = isMoving ? Math.random() * MAX_ASTEROID_SPEED : 0;
        const height = Math.random() * MAX_ASTEROID_HEIGHT + MIN_ASTEROID_HEIGHT;
        const width = height;
        const id = uuid();
        const deg = this.getRandomDeg();
        const gemPoints = this.getPoints();

        let tries = 10;
        let asteroid = new Asteroid(
            {id, x, y, height, width, speed, deg, type: GameObjectType.Asteroid}
        );
        while (tries > 0 && !this.isValid(asteroid, otherAsteroids)) {
            x = this.getRandomX();
            y = this.getRandomY();
            asteroid = new Asteroid({gemPoints, id, x, y, height, width, speed, deg: 0, type: GameObjectType.Asteroid});
            tries--;
        }
        return this.isValid(asteroid, otherAsteroids) ? asteroid : undefined;
    }
}