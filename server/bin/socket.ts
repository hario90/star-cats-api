import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { AsteroidDTO, GameEventType, GemDTO, LaserBeamDTO, ShipDamageArgs, ShipDTO, SocketAuth } from "../../shared/types";
import { Ship } from "../../shared/objects/ship";
import { Asteroid } from "../../shared/objects/asteroid";
import { LaserBeam } from "../../shared/objects/laser-beam";
import { Gem } from "../../shared/objects/gem";
import { getDegBetweenObjects } from "../../shared/util";
import { createInitialObjects, generateRandomShip, mapToJSONList } from "./socket-utils";

export function createWebSocket(server: HttpServer) {
    const io = new Server(server, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
      }
    });
    const ships = new Map<string, Ship>();
    const evilShips = new Set<string>();
    const shipToEvilShips = new Map<string, Set<string>>();
    const {asteroids} = createInitialObjects();
    const laserBeams = new Map<string, LaserBeam>();
    const gems = new Map<string, Gem>();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name } = socket.handshake.auth;
      const userId = socket.id;
      // TODO don't put ship on asteroids
      const ship = generateRandomShip({name, id: userId, speed: 1});

      const evilShipIds = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const evilShip = generateRandomShip({
          name: `Mr. Evil ${i + 1}`
        });
        evilShips.add(evilShip.id);
        ships.set(evilShip.id, evilShip);
        evilShipIds.add(evilShip.id);
      }

      shipToEvilShips.set(userId, evilShipIds);

      ships.set(userId, ship);
      socket.emit(GameEventType.GetInitialObjects, mapToJSONList(ships), mapToJSONList(asteroids), mapToJSONList(laserBeams), mapToJSONList(gems));
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${userId} has joined`);
      next();
    });
    io.on("connection", async (socket: Socket) => {
      const { name } = socket.handshake.auth as SocketAuth;
      const userId = socket.id;

      socket.on(GameEventType.ShipMoved, (obj: ShipDTO, onShipsMoved: (shipDTOs: ShipDTO[]) => void) => {
        const matchingShip = ships.get(obj.id);
        if (matchingShip) {
          const degChanged = matchingShip.deg !== obj.deg;
          matchingShip.move(obj);
          socket.broadcast.emit(GameEventType.ShipMoved, matchingShip.toDTO());

          const evilShipIds = shipToEvilShips.get(userId);
          if (evilShipIds) {
            const evilShips = [];
            for (const id of evilShipIds) {
              const evilShip = ships.get(id);
              if (!evilShip) {
                console.log("Could not find evil ship")
                continue;
              }
              // make evil ship go towards ship
              if (degChanged) {
                // adding 90 b/c the ship image starts rotated 90 deg counter-clockwise from the x-axis
                // and so when the image is drawn, we subtract 90 degrees
                const deg = getDegBetweenObjects(evilShip, matchingShip) + 90;
                evilShip.deg = deg;
              }

              const [x, y] = evilShip.getNextPosition();
              evilShip.x = x;
              evilShip.y = y;
              evilShips.push(evilShip.toDTO());
              socket.broadcast.emit(GameEventType.ShipMoved, evilShip.toDTO());
            }
            onShipsMoved(evilShips);
          }
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
        console.log("asteroid exploded")
        if (!asteroids.has(asteroid.id)) {
          console.log("asteroid not found")
          return;
        }

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
      socket.on(GameEventType.ShipExploded, (shipId: string, laserBeamId: string, shipExploded: (shipId: string, lives: number, laserBeamId?: string) => void) => {
        console.log(`Ship ${shipId} exploded.`)
        const ship = ships.get(shipId);
        if (ship) {
          ship.lives--;
          if (ship.lives <= 0) {
            ships.delete(shipId);
          }

          shipExploded(shipId, ship.lives, laserBeamId);
          socket.broadcast.emit(GameEventType.ShipExploded, shipId, ship.lives, laserBeamId);
        }

        laserBeams.delete(laserBeamId);
      })
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
        console.log("asteroid hit")
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
        const speed = 0.5;
        const a1 = {
          ...asteroid,
          speed,
          id: uuidV4(),
          width: radius,
          height: radius,
          x: nextPos1[0],
          y: nextPos1[1]
        }
        const a2 = {
          ...asteroid,
          speed,
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
