import { v4 as uuidV4 } from "uuid";

import { BOARD_WIDTH, BOARD_HEIGHT, halfShipHeight, halfShipWidth } from "../../shared/constants";
import { Asteroid } from "../../shared/objects/asteroid";
import { GameObject } from "../../shared/objects/game-object";
import { Ship } from "../../shared/objects/ship";
import { GameObjectDTO, GameObjectType, ShipDTO } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";

export function createInitialObjects() {
    const asteroids = new Map<string, Asteroid>();
    const asteroidGenerator = new AsteroidGenerator();
    for (let i = 0; i < 20; i++) {
      const asteroid = asteroidGenerator.random(false, asteroids.values());
      if (asteroid) {
        asteroids.set(asteroid.id, asteroid);
      }
    }
    return {asteroids};
  }

export function mapToJSONList(map: Map<string, GameObject>): GameObjectDTO[] {
    const values: GameObjectDTO[] = [];
    for (const value of map.values()) {
        values.push(value.toDTO())
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
        height: 2 * halfShipHeight,
        width: 2 * halfShipWidth,
        id: uuidV4(),
        points: 0,
        ...ship,
      });
}