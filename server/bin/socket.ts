import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { AsteroidDTO, GameEventType, GameObjectDTO, GameObjectType, GemDTO, LaserBeamDTO, ShipDTO, SocketAuth } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";
import { Ship } from "../../shared/objects/ship";
import { BOARD_HEIGHT, BOARD_WIDTH, halfShipHeight, halfShipWidth } from "../../shared/constants";
import { GameObject } from "../../shared/objects/game-object";
import { Asteroid } from "../../shared/objects/asteroid";
import { LaserBeam } from "../../shared/objects/laser-beam";
import { Gem } from "../../shared/objects/gem";

function createInitialObjects() {
  const asteroids = new Map<string, Asteroid>();
  const asteroidGenerator = new AsteroidGenerator();
  for (let i = 0; i < 100; i++) {
    const asteroid = asteroidGenerator.random(false, asteroids.values());
    if (asteroid) {
      asteroids.set(asteroid.id, asteroid);
    }
  }
  return {asteroids};
}

function mapToJSONList(map: Map<string, GameObject>): GameObjectDTO[] {
  const values: GameObjectDTO[] = [];
  for (const value of map.values()) {
    values.push(value.toDTO())
  }
  return values;
}

export function createWebSocket(server: HttpServer) {
    const io = new Server(server, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
      }
    });
    const ships = new Map<string, Ship>();
    const {asteroids} = createInitialObjects();
    const laserBeams = new Map<string, LaserBeam>();
    const gems = new Map<string, Gem>();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name } = socket.handshake.auth;
      const userId = socket.id;
      // todo don't put ship on asteroids
      const x = Math.random() * BOARD_WIDTH;
      const y = Math.random() * BOARD_HEIGHT;
      let ship = new Ship({
        type: GameObjectType.Ship,
        x,
        y,
        speed: 1,
        deg: 0,
        height: 2 * halfShipHeight,
        width: 2 * halfShipWidth,
        id: userId,
        points: 0,
        name,
      });

      ships.set(userId, ship);
      socket.emit(GameEventType.GetInitialObjects, mapToJSONList(ships), mapToJSONList(asteroids), mapToJSONList(laserBeams), mapToJSONList(gems));
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${userId} has joined`);
      next();
    });
    io.on("connection", (socket: Socket) => {
      const { name } = socket.handshake.auth as SocketAuth;
      const userId = socket.id;

      socket.on(GameEventType.ShipMoved, (obj: ShipDTO) => {
        const matchingShip = ships.get(obj.id);
        if (matchingShip) {
          matchingShip.move(obj);
          socket.broadcast.emit(GameEventType.ShipMoved, matchingShip.toDTO());
        }
      });
      socket.on(GameEventType.LaserMoved, (obj: LaserBeamDTO) => {
        const matchingLaserBeam = laserBeams.get(obj.id);
        if (matchingLaserBeam) {
          matchingLaserBeam.move(obj);
          socket.broadcast.emit(GameEventType.LaserMoved, matchingLaserBeam.toDTO());
        } else {
          laserBeams.set(obj.id, new LaserBeam(obj));
        }
      })
      socket.on(GameEventType.AsteroidMoved, (obj: AsteroidDTO) => {
        const matchingAsteroid = asteroids.get(obj.id);
        if (matchingAsteroid) {
          matchingAsteroid.move(obj);
          socket.broadcast.emit(GameEventType.AsteroidMoved, matchingAsteroid.toDTO());
        } else {
          asteroids.set(obj.id, new Asteroid(obj));
        }
      })
      socket.on(GameEventType.EmitLaserBeam, (laserBeam: LaserBeamDTO) => {
        laserBeams.set(laserBeam.id, new LaserBeam(laserBeam));
        socket.broadcast.emit(GameEventType.LaserMoved, laserBeam);
      });
      socket.on(GameEventType.ShipDamage, (shipId: string, healthPoints: number) => {
        const ship = ships.get(shipId);
        if (ship) {
          ship.healthPoints = healthPoints;
          socket.broadcast.emit(GameEventType.ShipDamage, shipId, healthPoints);
        }
      });
      socket.on(GameEventType.ShipExploded, (id: string, laserBeamId: string) => {
        ships.delete(id);
        if (laserBeamId) {
          laserBeams.delete(laserBeamId);
        }
      });
      socket.on(GameEventType.AsteroidExploded, (id: string, laserBeamId: string) => {
        const matchingAsteroid = asteroids.get(id);
        const gemsToAdd: Gem[] = [];

        if (matchingAsteroid) {
          const id = uuidV4();
          const gem = new Gem({
            ...matchingAsteroid,
            id,
          });
          gems.set(id, gem);
          gemsToAdd.push(gem);
          asteroids.delete(id);
        }

        if (laserBeamId) {
          laserBeams.delete(laserBeamId);
        }
        socket.emit(GameEventType.AddGems, gemsToAdd);
      });
      socket.on(GameEventType.ShipPickedUpGem, (shipId: string, gemId: string) => {
        const matchingShip = ships.get(shipId);
        const matchingGem = gems.get(gemId);
        if (matchingShip && matchingGem) {
          matchingShip.points = matchingGem.points;
          gems.delete(gemId);
          socket.emit(GameEventType.ShipPickedUpGem, shipId, gemId);
        }
      });
      socket.on(GameEventType.AsteroidHit, (asteroidId: string, asteroid1: AsteroidDTO, asteroid2: AsteroidDTO, laserBeamId?: string) => {
        const matchingAsteroid = asteroids.get(asteroidId);
        if (matchingAsteroid) {
          if (laserBeamId) {
            laserBeams.delete(laserBeamId);
          }

          asteroids.delete(asteroidId);
          asteroids.set(asteroid1.id, new Asteroid(asteroid1));
          asteroids.set(asteroid2.id, new Asteroid(asteroid2));
          socket.emit(GameEventType.AsteroidHit, asteroidId, asteroid1, asteroid2, laserBeamId);
        }
      })
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        ships.delete(userId);
        socket.broadcast.emit(GameEventType.UserLeft, userId, `${name} has left the game`)
      });
    });
}
