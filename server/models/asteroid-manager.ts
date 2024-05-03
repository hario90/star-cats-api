import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { Asteroid } from "../../shared/objects/asteroid";
import { AsteroidDTO, GameEventType } from "../../shared/types";
import { GameObjectManager } from "./game-object-manager";

export class AsteroidManager extends GameObjectManager<Asteroid, AsteroidDTO> {
    constructor(roomId: string) {
        super(roomId, GameEventType.AsteroidMoved)
        this.initialize = this.initialize.bind(this);
        this.handleAsteroidHit = this.handleAsteroidHit.bind(this);
    }

    public initialize(asteroids: Map<string, Asteroid>) {
        this.objects = asteroids;
    }

    public handleAsteroidHit(socket: Socket, asteroid: AsteroidDTO, cb: (a1: AsteroidDTO, a2: AsteroidDTO) => void) {
        const matchingAsteroid = this.objects.get(asteroid.id);
        console.log("asteroid hit");
        if (!matchingAsteroid) {
            console.log("could not find matching asteroid");
            return;
        }

        this.deleteObjectById(asteroid.id);
        // split asteroid into 2 asteroids half the original size, 180 deg apart
        const radius = Math.round(asteroid.width / 2);
        const nextPos1 = matchingAsteroid.getNextPosition(
            Math.floor(radius / 2)
        );
        const nextPos2 = matchingAsteroid.getNextPosition(
            Math.floor(radius / 2),
            asteroid.deg + 180
        );
        const speed = 0.5;
        const a1 = {
            ...asteroid,
            speed,
            id: uuidV4(),
            width: radius,
            height: radius,
            x: nextPos1[0],
            y: nextPos1[1],
        };
        const a2 = {
            ...asteroid,
            speed,
            id: uuidV4(),
            width: radius,
            height: radius,
            x: nextPos2[0],
            y: nextPos2[1],
            deg: asteroid.deg + 180,
        };

        this.objects.set(a1.id, new Asteroid(a1));
        this.objects.set(a2.id, new Asteroid(a2));

        cb(a1, a2);
        socket.to(this.roomId).emit(GameEventType.AsteroidHit, a1, a2);
    }
}