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
