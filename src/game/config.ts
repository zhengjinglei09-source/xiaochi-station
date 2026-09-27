export const CONFIG = {
  logicalWidth: 360,
  mapWidth: 680,
  speed: 69,
  playerRadius: 6,
  characterHeight: 81,
  walkCycleHz: 2.6,
  joystickRadius: 43,
  joystickDeadZone: 7,
  triggerWidth: 0.4,
} as const;
export type Direction = 'front' | 'back' | 'left' | 'right';
export type Motion = 'idle' | 'walk';
export interface Vec2 { x: number; y: number }
export interface Rect extends Vec2 { width: number; height: number }
