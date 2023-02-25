import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";
import { GameObject } from "./objects/game-object";
import { PositionInfo, ISection } from "./types";

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

export function hasCollided<T extends GameObject>(
    ship: T,
    objects: T[]
): boolean {
    return objects.some((o) => isOverlapping(o, ship));
}

// Assume each object can be represented as circles so that degree doesn't matter
export function isOverlapping<T extends PositionInfo, P extends PositionInfo>(
    o1: T,
    o2: P
): boolean {
    const dist = distanceBetweenObjects(o1, o2);
    return dist <= 0;
}

export function distanceBetweenObjects<
    T extends PositionInfo,
    V extends PositionInfo
>(o1: T, o2: V): number {
    const xDistance = o1.x - o2.x;
    const yDistance = o1.y - o2.y;
    const distanceFromCenters = Math.sqrt(
        Math.pow(xDistance, 2) + Math.pow(yDistance, 2)
    );
    const radius1 = Math.floor(o1.width / 2);
    const radius2 = Math.floor(o2.width / 2);
    // the closest these objects can be is the sum of their radiuses.
    return distanceFromCenters - (radius1 + radius2);
}

export type Coordinate = [number, number];

// This is used for determining if an asteroid overlaps with a section of the grid
export function isOverlappingWithSection<
    T extends WithBoundries,
    V extends WithBoundries
>(o1: T, o2: V): boolean {
    const { minX: minX1, maxX: maxX1, minY: minY1, maxY: maxY1 } = o1;
    const { minX: minX2, maxX: maxX2, minY: minY2, maxY: maxY2 } = o2;
    const o2XMinIsWithinXBoundOfO1 = minX1 <= minX2 && maxX1 >= minX2;
    const o2XMaxIsWithinXBoundsOfO1 = minX1 <= maxX2 && maxX1 >= maxX2;
    const o2YMinIsWithinYBoundsOfO1 = minY1 <= minY2 && maxY1 >= minY2;
    const o2YMaxIsWithinYBoundsOfO1 = minY1 <= maxY2 && maxY1 >= maxY2;

    return (
        (o2XMinIsWithinXBoundOfO1 || o2XMaxIsWithinXBoundsOfO1) &&
        (o2YMinIsWithinYBoundsOfO1 || o2YMaxIsWithinYBoundsOfO1)
    );
}

export function isPointOverlappingWithSection(
    point: [number, number],
    section: ISection
) {
    const { minX, maxX, minY, maxY } = section;
    const [x, y] = point;
    return x >= minX && x <= minY && y >= minY && y <= maxY;
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

// The degree will be according to the canvas degrees (clockwise starting at the x-axis)
export function getDegBetweenPoints(
    o1: [number, number],
    o2: [number, number]
): number {
    // shift o1 and o2 such that o1 is at the origin
    const x1 = o1[0];
    const y1 = o1[1];
    const x2 = o2[0];
    const y2 = o2[1];
    const x = x2 - x1;
    const y = y1 - y2; // the canvas is flipped so that up is down and down is up...
    const normalDeg = (Math.atan2(y, x) * 180) / Math.PI;

    // normalDeg ranges from -180 to 180.
    // if it's positive, add 180 deg
    // if it's neg, multiply by -1

    let result = 0;
    if (normalDeg < 0) {
        result = normalDeg * -1;
    }
    if (normalDeg > 0) {
        result = 360 - normalDeg;
    }

    return result % 360;
}

export function getRandomInt(min: number, max: number): number {
    const diff = Math.floor(max) - Math.floor(min);
    const rand = Math.random();
    return Math.floor(rand * diff) + Math.floor(min);
}
