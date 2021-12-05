import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { AsteroidDTO, GameEventType, GameObjectDTO, GameObjectType, GemDTO, LaserBeamDTO, ShipDamageArgs, ShipDTO, SocketAuth } from "../../shared/types";
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
  for (let i = 0; i < 20; i++) {
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
      // todo delete?
      socket.on(GameEventType.LaserMoved, (obj: LaserBeamDTO) => {
        const matchingLaserBeam = laserBeams.get(obj.id);
        if (matchingLaserBeam) {
          matchingLaserBeam.move(obj);
          socket.broadcast.emit(GameEventType.LaserMoved, matchingLaserBeam.toDTO());
        } else {
          laserBeams.set(obj.id, new LaserBeam(obj));
        }
      })
      // todo delete?
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
      socket.on(GameEventType.ShipDamage, (shipDamageArgs: ShipDamageArgs, onShipDamage: (shipId: string, healthPoints: number, lives: number) => void) => {
        const ship = ships.get(socket.id);
        if (!ship) {
          return;
        }

        const {laserBeamId, asteroidId, shipId} = shipDamageArgs;

        let reduceBy = 0;
        if (laserBeamId) {
          laserBeams.delete(laserBeamId);
          reduceBy = 1;
        } else if (asteroidId) {
          reduceBy = ship.healthPoints;
        } else if (shipId) {
          const matchingShip = ships.get(shipId);
          if (matchingShip) {
            reduceBy = Math.round(matchingShip.width / 10);
          }
        }

        if (!onShipDamage) {
          console.log("onShipDamage not defined")
        }

        console.log("ship? " + !!ship);
        console.log("reduceBy " + reduceBy)

        if (ship && reduceBy && onShipDamage) {
          console.log("reducing ships health points by " + reduceBy)
          ship.reduceHealthPoints(reduceBy);
          onShipDamage(socket.id, ship.healthPoints, ship.lives);
          socket.broadcast.emit(GameEventType.ShipDamage, socket.id, ship.healthPoints, ship.lives)
          if (ship.healthPoints <= 0) {
            ships.delete(socket.id);
            // TODO disconnect because game over
          }
        }


      });
      socket.on(GameEventType.AsteroidExploded, (asteroid: AsteroidDTO, laserBeamId: string, addGem: (gem: GemDTO) => void) => {
        console.log("asteroid exploded", asteroid)
        if (!asteroids.has(asteroid.id)) {
          return;
        }
        console.log("asteroid found")

        // Gem has same id as asteroid
        const gem = new Gem({...asteroid, points: asteroid.gemPoints});
        asteroids.delete(asteroid.id);
        gems.set(gem.id, gem)

        laserBeams.delete(laserBeamId);

        // Keep event sender in sync with rest of the clients
        addGem(gem.toDTO());
        console.log("broadcasting add gem")
        socket.broadcast.emit(GameEventType.AddGem, gem.toDTO());
      });
      socket.on(GameEventType.ShipPickedUpGem, (shipId: string, gemId: string, cb: (shipId: string, gemId: string, shipPoints: number) => void) => {
        console.log("ship picked up gem")
        const matchingShip = ships.get(shipId);
        const matchingGem = gems.get(gemId);
        console.log("matching ship", matchingShip);
        console.log("matching gem", matchingGem)
        if (matchingShip && matchingGem) {
          console.log("found matches")
          matchingShip.points += matchingGem.points;
          gems.delete(gemId);
          cb(shipId, gemId, matchingShip.points);
          socket.broadcast.emit(GameEventType.ShipPickedUpGem, shipId, gemId, matchingShip.points);
        }
      });
      socket.on(GameEventType.AsteroidHit, (asteroid: AsteroidDTO, laserBeamId: string, cb: (a1: AsteroidDTO, a2: AsteroidDTO) => void) => {
        const matchingAsteroid = asteroids.get(asteroid.id);
        console.log("asteroid hit", asteroid)
        if (!matchingAsteroid) {
          console.log("could not find matching asteroid")
          return;
        }

        asteroids.delete(asteroid.id);
        laserBeams.delete(laserBeamId);

        // split asteroid into 2 asteroids half the original size, 180 deg apart
        const radius = Math.round(asteroid.width / 2);
        const nextPos1 = matchingAsteroid.getNextPosition(Math.floor(radius / 2));
        const nextPos2 = matchingAsteroid.getNextPosition(Math.floor(radius / 2), asteroid.deg + 180);
        const a1 = {
          ...asteroid,
          id: uuidV4(),
          width: radius,
          height: radius,
          x: nextPos1[0],
          y: nextPos1[1]
        }
        const a2 = {
          ...asteroid,
          id: uuidV4(),
          width: radius,
          height: radius,
          x: nextPos2[0],
          y: nextPos2[1],
          deg: asteroid.deg + 180
        }

        asteroids.set(a1.id, new Asteroid(a1));
        asteroids.set(a2.id, new Asteroid(a2));

        cb(a1, a2);
        socket.broadcast.emit(GameEventType.AsteroidHit, a1, a2);
      })
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        ships.delete(userId);
        socket.broadcast.emit(GameEventType.UserLeft, userId, `${name} has left the game`)
      });
    });
}
