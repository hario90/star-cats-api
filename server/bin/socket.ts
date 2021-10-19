import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../shared/constants";
import { GameEventType, GameObject, PositionInfo, SocketAuth } from "../../shared/types";
import { AsteroidGenerator } from "../asteroid-generator";
import { Asteroid } from "../objects/asteroid";
import { Ship } from "../objects/ship";

const NUM_COLUMNS = 8;
const NUM_ROWS = 8;
const ROW_THICKNESS = BOARD_HEIGHT / NUM_ROWS;
const COL_THICKNESS = BOARD_WIDTH / NUM_COLUMNS;

interface WithBoundries {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

type Coordinate = [number, number];
const getSectionKey = (row: number, col: number) => `${row},${col}`;

// TODO: This currently does not account for rotation (aka the ship's deg property)
function isOverlappingHelper<T extends WithBoundries>(o1: T, o2: T): boolean {
  const {minX: minX1, maxX: maxX1, minY: minY1, maxY: maxY1} = o1;
  const {minX: minX2, maxX: maxX2, minY: minY2, maxY: maxY2} = o2;
  return ((minX1 <= maxX2 && minX1 >= minX2) && (minY1 >= minY2 && minY1 <= maxY2));
}

function isOverlapping<T extends WithBoundries>(o1: T, o2:T): boolean {
  return isOverlappingHelper(o1, o2) || isOverlappingHelper(o2, o1);
}

// determine which sections of the game board the object falls in
// returns an array of coordinates where each coordinate is a [row, col] value
function getObjectSections<T extends GameObject>(o: T): Coordinate[] {
  const sections: Array<[number, number]> = [];
  for (let row = 0; row < NUM_ROWS; row++) {
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const sectionYMin = row * ROW_THICKNESS;
      const sectionYMax = sectionYMin + ROW_THICKNESS;
      const sectionXMin = col * COL_THICKNESS;
      const sectionXMax = sectionXMin + COL_THICKNESS;
      const section = {
        minX: Math.floor(sectionXMin),
        maxX: Math.floor(sectionXMax),
        minY: Math.floor(sectionYMin),
        maxY: Math.floor(sectionYMax),
      };
      if (isOverlapping(section, o)) {
        sections.push([row, col]);
      }
    }
  }
  return sections;
}

function createInitialObjects() {
  const asteroids = [];
  // keep track of all asteroids per section of the canvas
  const objectMap = new Map<string, Asteroid[]>();
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLUMNS; j++) {
      const key = getSectionKey(i, j);
      objectMap.set(key, []);
    }
  }

  const asteroidGenerator = new AsteroidGenerator();
  for (let i = 0; i < 15; i++) {
    const asteroid = asteroidGenerator.random(false);
    asteroids.push(asteroid);

    const sections: Array<[number, number]> = getObjectSections(asteroid);
    for (const [row, column] of sections) {
      const key = getSectionKey(row, column);
      const currObjects = objectMap.get(key) || [];
      currObjects.push(asteroid);
      objectMap.set(key, currObjects);
    }
  }

  console.log(objectMap)
  return {asteroids, objectMap};
}
// todo figure out why objects.length is always 15
function hasCollided<T extends GameObject>(ship: T, objects: T[]): boolean {
  return objects.some((o) => isOverlapping(o, ship));
}

function getSections<T extends GameObject>(positionInfo: T): string[] {
  const sections = [];
  // exclude sections where the max x is less than or equal to the min x of input
  // exclude sections where the max y is less than or equal to the min y of the input
  for (let row = 0; row < NUM_ROWS; row++) {
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const section = {
        minX: col * COL_THICKNESS,
        maxX: (1 + col) * COL_THICKNESS,
        minY: row * ROW_THICKNESS,
        maxY: (1 + row) * ROW_THICKNESS,
      }
      if (isOverlapping(section, positionInfo)) {
        sections.push(getSectionKey(row, col));
      }
    }
  }
  return sections;
}

export function createWebSocket(server: HttpServer) {
    const ships: Ship[] = [];
    const io = new Server(server, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
      }
    });
    const shipToIndex = new Map<string, number>();
    const {asteroids, objectMap} = createInitialObjects();
    // TODO if this becomes a multi-room app, this will probably need to be roomToShipMap or maybe use a hash of room and ship id depending on how we use this structure

    io.use((socket: any, next: () => void) => {
      const { name } = socket.handshake.auth;
      const userId = socket.id;
      const ship = new Ship(name, userId);
      ships.push(ship);
      socket.emit(GameEventType.Ships, ships, asteroids);
      socket.broadcast.emit(GameEventType.UserJoined, name);
      console.log(`user ${name}, id ${userId} has joined`);
      shipToIndex.set(userId, ships.length - 1);
      next();
    });
    io.on("connection", (socket: Socket) => {
      const { name } = socket.handshake.auth as SocketAuth;
      const userId = socket.id;

      socket.on(GameEventType.ShipMoved, (positionInfo: PositionInfo) => {
        const index = shipToIndex.get(userId);
        if (index !== undefined && index > -1 && index < ships.length) {
          const ship = ships[index];
          ship.move(positionInfo);
          socket.broadcast.emit(GameEventType.ShipMoved, ship);
          const shipSections: string[] = getSections(ship);
          const asteroidsToCheckForCollision = new Set<Asteroid>();
          for (const shipSectionKey of shipSections) {
            const objects = objectMap.get(shipSectionKey) || [];
            // console.log("asteroids in same section", objects)
            // no asteroids logged but there should be.
            for (const obj of objects) {
              asteroidsToCheckForCollision.add(obj);
            }
          }

          // A ship crashed into an asteroid!
          if (hasCollided(ship, Array.from(asteroidsToCheckForCollision))) {
            socket.emit(GameEventType.ShipExploded, ship.id)
            // TODO remove ship from the game
          }
        }
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`user ${name}, id ${userId} has disconnected. Reason: ${reason}`);
        const index = shipToIndex.get(userId);
        if (index !== undefined) {
          ships.splice(index, 1);
        }
        socket.broadcast.emit(GameEventType.UserLeft, userId, `${name} has left the game`)
      });
    });
}
