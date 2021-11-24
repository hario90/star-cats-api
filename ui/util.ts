import { Drawable } from "./objects/drawable";

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