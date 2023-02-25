import { v4 as uuidV4 } from "uuid";

import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    halfShipHeight,
    halfShipWidth,
} from "../../shared/constants";
import { Asteroid } from "../../shared/objects/asteroid";
import { GameObject } from "../../shared/objects/game-object";
import { Planet } from "../../shared/objects/planet";
import { Ship } from "../../shared/objects/ship";
import {
    EnemyShipColor,
    GameObjectDTO,
    GameObjectType,
    ShipDTO,
    ShipModelNum,
} from "../../shared/types";
import { ObjectGenerator } from "../asteroid-generator";

export function createInitialObjects() {
    const asteroids = new Map<string, Asteroid>();
    const asteroidGenerator = new ObjectGenerator();
    for (let i = 0; i < 20; i++) {
        const asteroid = asteroidGenerator.random(false, asteroids.values());
        if (asteroid) {
            asteroids.set(asteroid.id, asteroid);
        }
    }
    // const planet = asteroidGenerator.randomPlanet(asteroids.values());
    const planets = new Map<string, Planet>();
    // if (planet) {
    //     planet.x = 100;
    //     planet.y = 100;
    //     planets.set(planet.id, planet);
    // }
    return { asteroids, planets };
}

export function mapToJSONList(map: Map<string, GameObject>): GameObjectDTO[] {
    const values: GameObjectDTO[] = [];
    for (const value of map.values()) {
        values.push(value.toDTO());
    }
    return values;
}

export function generateRandomShip(ship: Partial<ShipDTO>) {
    return new Ship({
        type: GameObjectType.Ship,
        x: Math.random() * BOARD_WIDTH,
        y: Math.random() * BOARD_HEIGHT,
        speed: Math.floor(1 + Math.random() * 4),
        deg: 0,
        shootDeg: 0,
        height: 2 * halfShipHeight,
        width: 2 * halfShipWidth,
        id: uuidV4(),
        points: 0,
        userControlled: false,
        color: ship.color ?? EnemyShipColor.Blue,
        modelNum: ship.modelNum ?? ShipModelNum.One,
        ...ship,
    });
}
