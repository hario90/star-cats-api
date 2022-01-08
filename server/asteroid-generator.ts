import { v4 as uuid } from "uuid";

import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    MAX_ASTEROID_HEIGHT,
    MAX_ASTEROID_SPEED,
    MIN_ASTEROID_HEIGHT,
} from "../shared/constants";
import { isOverlappingWithSection } from "../shared/util";
import { Asteroid } from "../shared/objects/asteroid";
import { GameObjectDTO, GameObjectType } from "../shared/types";
import { GameObject } from "../shared/objects/game-object";
import { Planet } from "../shared/objects/planet";

const BUFFER = 50 + 0.5 * MAX_ASTEROID_HEIGHT;
export class ObjectGenerator {
    constructor() {}

    getRandomX() {
        return BUFFER + Math.random() * (BOARD_WIDTH - BUFFER);
    }

    getRandomY() {
        return BUFFER + Math.random() * (BOARD_HEIGHT - BUFFER);
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

    isInbounds(asteroid: GameObject) {
        return (
            asteroid.minX >= 0 &&
            asteroid.maxX <= BOARD_WIDTH &&
            asteroid.minY >= 0 &&
            asteroid.maxY <= BOARD_HEIGHT
        );
    }

    isOverlappingWithOtherObjects(
        asteroid: GameObject,
        others: Iterable<GameObject>
    ): boolean {
        let isOverlapping = false;
        for (const other of others) {
            if (isOverlappingWithSection(asteroid, other)) {
                isOverlapping = true;
                break;
            }
        }
        return isOverlapping;
    }

    isValid(asteroid: GameObject, others: Iterable<GameObject>): boolean {
        return (
            this.isInbounds(asteroid) &&
            !this.isOverlappingWithOtherObjects(asteroid, others)
        );
    }

    randomPlanet(
        otherAsteroids: Iterable<GameObject>
    ): Planet | undefined {
        let tries = 10;
        let planet = new Planet({
            ...this.randomGameObject(90, 90),
            deg: 0,
            type: GameObjectType.Planet,
            userControlled: false,
        });
        while (tries > 0 && !this.isValid(planet, otherAsteroids)) {
            planet = new Planet({
                ...this.randomGameObject(90, 90),
                type: GameObjectType.Planet,
                userControlled: false,
            });
            tries--;
        }
        return this.isValid(planet, otherAsteroids) ? planet : undefined;
    }

    randomGameObject(minHeight: number, maxHeight: number): GameObjectDTO {
        let x = this.getRandomX();
        let y = this.getRandomY();
        const speed = 0;
        const height =
            Math.random() * maxHeight + minHeight;
        const width = height;
        const id = uuid();
        const deg = this.getRandomDeg();

        return {
            id,
            x,
            y,
            height,
            width,
            speed,
            deg,
            type: GameObjectType.Asteroid,
            userControlled: false,
        };
    }

    random(
        isMoving: boolean,
        otherAsteroids: Iterable<GameObject>
    ): Asteroid | undefined {
        let x = this.getRandomX();
        let y = this.getRandomY();
        const speed = isMoving ? Math.random() * MAX_ASTEROID_SPEED : 0;
        const gemPoints = this.getPoints();

        let tries = 10;
        let asteroid = new Asteroid({
            ...this.randomGameObject(MIN_ASTEROID_HEIGHT, MAX_ASTEROID_HEIGHT),
            gemPoints,
            speed,
            type: GameObjectType.Asteroid,
            userControlled: false,
        });
        while (tries > 0 && !this.isValid(asteroid, otherAsteroids)) {
            x = this.getRandomX();
            y = this.getRandomY();
            asteroid = new Asteroid({
                ...this.randomGameObject(MIN_ASTEROID_HEIGHT, MAX_ASTEROID_HEIGHT),
                gemPoints,
                speed,
                type: GameObjectType.Asteroid,
                userControlled: false,
            });
            tries--;
        }
        return this.isValid(asteroid, otherAsteroids) ? asteroid : undefined;
    }
}
