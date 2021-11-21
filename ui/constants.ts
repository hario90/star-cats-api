export const SERVER_URL = `${PROTOCOL}://${HOST || "localhost"}${PORT ? `:${PORT}` : ""}`;
export const MAX_ASTEROID_SPEED = 15;
export const MAX_ASTEROID_HEIGHT = 100;

export const EXPLOSION_WIDTH = 128;
export const HALF_EXPLOSION_WIDTH = EXPLOSION_WIDTH / 2;
export const EXPLOSION_LOCATIONS = [
  [0, 0],
  [EXPLOSION_WIDTH, 0],
  [2*EXPLOSION_WIDTH, 0],
  [3*EXPLOSION_WIDTH, 0],
  [0, EXPLOSION_WIDTH],
  [EXPLOSION_WIDTH, EXPLOSION_WIDTH],
  [2*EXPLOSION_WIDTH, EXPLOSION_WIDTH],
  [3*EXPLOSION_WIDTH, EXPLOSION_WIDTH],
  [0, 2*EXPLOSION_WIDTH],
  [EXPLOSION_WIDTH, 2*EXPLOSION_WIDTH],
  [2*EXPLOSION_WIDTH, 2*EXPLOSION_WIDTH],
  [3*EXPLOSION_WIDTH, 2*EXPLOSION_WIDTH],
  [0, 3*EXPLOSION_WIDTH],
  [EXPLOSION_WIDTH, 3*EXPLOSION_WIDTH]
];
