import { Drawable } from "../ui/objects/drawable";
import { DrawableAsteroid } from "../ui/objects/drawable-asteroid";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";
import { GameObject } from "./objects/game-object";
import { PositionInfo } from "./types";

export const NUM_COLUMNS = 8;
export const NUM_ROWS = 8;
export const ROW_THICKNESS = BOARD_HEIGHT / NUM_ROWS;
export const COL_THICKNESS = BOARD_WIDTH / NUM_COLUMNS;

interface WithBoundries {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }

export function hasCollided<T extends GameObject>(ship: T, objects: T[]): boolean {
    return objects.some((o) => isOverlapping(o, ship));
}

// Assume each object can be represented as circles so that degree doesn't matter
export function isOverlapping<T extends PositionInfo>(o1: T, o2:T): boolean {
    const dist = distanceBetweenObjects(o1, o2);
    console.log(dist)
    return dist <= 0
}

export function distanceBetweenObjects<T extends PositionInfo>(o1: T, o2: T): number {
    const xDistance = o1.x - o2.x;
    const yDistance = o1.y - o2.y;
    const distanceFromCenters =  Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
    const radius1 = Math.floor(o1.width / 2);
    const radius2 = Math.floor(o2.width / 2);
    // the closest these objects can be is the sum of their radiuses.
    return distanceFromCenters - (radius1 + radius2)
}

export function getSections<T extends GameObject>(positionInfo: T): string[] {
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
        if (isOverlappingWithSection(section, positionInfo)) {
          sections.push(getSectionKey(row, col));
        }
      }
    }
    return sections;
  }

  type Coordinate = [number, number];
export const getSectionKey = (row: number, col: number) => `${row},${col}`;

// This is used for determining if an asteroid overlaps with a section of the grid
export function isOverlappingWithSection<T extends WithBoundries>(o1: T, o2:T): boolean {
  const {minX: minX1, maxX: maxX1, minY: minY1, maxY: maxY1} = o1;
  const {minX: minX2, maxX: maxX2, minY: minY2, maxY: maxY2} = o2;
  const o2XMinIsWithinXBoundOfO1 = minX1 <= minX2 && maxX1 >= minX2;
  const o2XMaxIsWithinXBoundsOfO1 = minX1 <= maxX2 && maxX1 >= maxX2;
  const o2YMinIsWithinYBoundsOfO1 = minY1 <= minY2 && maxY1 >= minY2;
  const o2YMaxIsWithinYBoundsOfO1 = minY1 <= maxY2 && maxY1 >= maxY2;

  return (o2XMinIsWithinXBoundOfO1 || o2XMaxIsWithinXBoundsOfO1) && (o2YMinIsWithinYBoundsOfO1 || o2YMaxIsWithinYBoundsOfO1);
}

// determine which sections of the game board the object falls in
// returns an array of coordinates where each coordinate is a [row, col] value
export function getObjectSections<T extends GameObject>(o: T): Coordinate[] {
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
      if (isOverlappingWithSection(section, o)) {
        sections.push([row, col]);
      }
    }
  }
  return sections;
}

export function createAsteroidSectionMap<T extends Drawable> (): Map<string, T[]> {
    const objectMap = new Map<string, T[]>();
    for (let i = 0; i < NUM_ROWS; i++) {
      for (let j = 0; j < NUM_COLUMNS; j++) {
        const key = getSectionKey(i, j);
        objectMap.set(key, []);
      }
    }
    return objectMap;
}

