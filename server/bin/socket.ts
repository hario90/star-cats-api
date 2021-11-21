import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { AsteroidDTO, GameEventType, GameObjectType, LaserBeamDTO, ShipDTO, SocketAuth } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";
import { Ship } from "../../shared/objects/ship";
import { halfShipHeight, halfShipWidth } from "../../shared/constants";
import { GameObject } from "../../shared/objects/game-object";
import { Asteroid } from "../../shared/objects/asteroid";
import { LaserBeam } from "../../shared/objects/laser-beam";


function createInitialObjects() {
  const asteroids = new Map<string, Asteroid>();
  const asteroidGenerator = new AsteroidGenerator();
  for (let i = 0; i < 15; i++) {
    const asteroid = asteroidGenerator.random(false, asteroids.values());
    if (asteroid) {
      asteroids.set(asteroid.id, asteroid);
    }
  }
  return {asteroids};
}

function mapToJSONList<T extends GameObject>(map: Map<string, T>): T[] {
  const values = [];
  for (const value of map.values()) {
    values.push(value.toJSON())
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
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name, x, y } = socket.handshake.auth;
      const userId = socket.id;
      const ship = new Ship({
        // todo
        type: GameObjectType.Ship,
        x,
        y,
        speed: 1,
        deg: 0,
        height: 2 * halfShipHeight,
        width: 2 * halfShipWidth,
        id: userId,
        name,
      });
      ships.set(userId, ship);
      socket.emit(GameEventType.GetInitialObjects, mapToJSONList(ships), mapToJSONList(asteroids), mapToJSONList(laserBeams));
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
          socket.broadcast.emit(GameEventType.ShipMoved, matchingShip.toJSON());
        }
      });
      socket.on(GameEventType.LaserMoved, (obj: LaserBeamDTO) => {
        const matchingLaserBeam = laserBeams.get(obj.id);
        if (matchingLaserBeam) {
          matchingLaserBeam.move(obj);
          socket.broadcast.emit(GameEventType.LaserMoved, matchingLaserBeam.toJSON());
        } else {
          laserBeams.set(obj.id, new LaserBeam(obj));
        }
      })
      socket.on(GameEventType.AsteroidMoved, (obj: AsteroidDTO) => {
        const matchingAsteroid = asteroids.get(obj.id);
        if (matchingAsteroid) {
          matchingAsteroid.move(obj);
          socket.broadcast.emit(GameEventType.AsteroidMoved, matchingAsteroid.toJSON());
        } else {
          asteroids.set(obj.id, new Asteroid(obj));
        }
      })
      socket.on(GameEventType.EmitLaserBeam, (laserBeam: LaserBeamDTO) => {
        laserBeams.set(laserBeam.id, new LaserBeam(laserBeam));
        socket.broadcast.emit(GameEventType.LaserMoved, laserBeam);
      });
      socket.on(GameEventType.ShipExploded, (id, laserBeamId) => {
        ships.delete(id);
        if (laserBeamId) {
          laserBeams.delete(laserBeamId);
        }
      });
      socket.on(GameEventType.AsteroidExploded, (id, laserBeamId) => {
        asteroids.delete(id);
        if (laserBeamId) {
          laserBeams.delete(laserBeamId);
        }
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        ships.delete(userId);
        socket.broadcast.emit(GameEventType.UserLeft, userId, `${name} has left the game`)
      });
    });
}
