import { GameObject } from "../shared/objects/game-object";
import { NUM_ROWS, NUM_COLUMNS, isOverlappingWithSection } from "../shared/util";
import { Drawable } from "./objects/drawable";
import { Section } from "./objects/section";

export function setupCanvas(canvas: HTMLCanvasElement) {
  // Get the device pixel ratio, falling back to 1.
  const dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  const rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  return  { ctx, dpr };
}

export const timeout = (ms: number) =>
  new Promise((resolve: (value: any) => void) => {
    setTimeout(resolve, ms);
  });

export const randomBoolean = () => Math.random() < 0.5;

// given that the player ship is at (shipX, shipY), find the position of the object relative
// to the player ship
export const getRelativePosition = (halfCanvasWidth: number, halfCanvasHeight: number,
  shipX: number, shipY: number, objectX: number, objectY: number): {x: number; y: number} => {
    const x = Math.round(halfCanvasWidth - (shipX - objectX));
    const y = Math.round(halfCanvasHeight - (shipY - objectY));
    return {x, y};
}

export function cleanUpResources<T extends Drawable>(id: string, objects: Map<string, T>, sectionToObjects: Map<string, Set<T>>) {
  const match = objects.get(id);
  if (match) {
    objects.delete(id);
    for (const [key] of match.sections) {
      const matchingGemsInSection = sectionToObjects.get(key);
      if (matchingGemsInSection) {
        matchingGemsInSection.delete(match);
      }
    }
  }
}

export function getSectionsMap<T extends GameObject>(positionInfo: T): Map<string, Section> {
  const sections = new Map<string, Section>();
  // exclude sections where the max x is less than or equal to the min x of input
  // exclude sections where the max y is less than or equal to the min y of the input
  for (let row = 0; row < NUM_ROWS; row++) {
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const section = new Section(row, col);
      if (isOverlappingWithSection(section, positionInfo)) {
        sections.set(
          section.key,
          section,
        );
      }
    }
  }
  return sections;
}

const getSectionKey = (row: number, col: number) => `${row},${col}`;

export function createSectionToObjectsMap (): Map<string, Set<string>> {
  const objectMap = new Map<string, Set<string>>();
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLUMNS; j++) {
      const key = getSectionKey(i, j);
      objectMap.set(key, new Set());
    }
  }
  return objectMap;
}

export function getSections<T extends GameObject>(positionInfo: T): string[] {
  const sections = [];
  // exclude sections where the max x is less than or equal to the min x of input
  // exclude sections where the max y is less than or equal to the min y of the input
  for (let row = 0; row < NUM_ROWS; row++) {
    for (let col = 0; col < NUM_COLUMNS; col++) {
      const section = new Section(row, col)
      if (isOverlappingWithSection(section, positionInfo)) {
        sections.push(section.key);
      }
    }
  }
  return sections;
}

