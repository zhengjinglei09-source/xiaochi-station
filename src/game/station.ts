import type { Rect } from './config';

// All collision coordinates refer to the feet, not the head or backpack.
export const station = {
  bounds: { x: 22, y: 163, width: 636, height: 188 } satisfies Rect,
  spawn: { x: 345, y: 265 },
  obstacles: [
    { id: 'bench-west', kind: 'bench', x: 120, y: 200, width: 74, height: 20 },
    { id: 'bench-east', kind: 'bench', x: 420, y: 202, width: 74, height: 20 },
    { id: 'planter-west', kind: 'plant', x: 38, y: 184, width: 26, height: 23 },
    { id: 'planter-east', kind: 'plant', x: 612, y: 184, width: 26, height: 23 },
    { id: 'notice', kind: 'notice', x: 534, y: 196, width: 42, height: 16 },
  ] as (Rect & { id: string; kind: string })[],
};
