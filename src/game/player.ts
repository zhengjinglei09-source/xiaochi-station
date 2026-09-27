import { CONFIG, type Direction, type Motion, type Rect, type Vec2 } from './config';
import { station } from './station';

export class Player {
  x = station.spawn.x;
  y = station.spawn.y;
  direction: Direction = 'front';
  motion: Motion = 'idle';
  animationTime = 0;

  constructor(private map: { bounds: Rect; obstacles: readonly Rect[] } = station) {}
  setMap(map: { bounds: Rect; obstacles: readonly Rect[] }) { this.stop(); this.map = map; }

  private canStand(x: number, y: number): boolean {
    const r = CONFIG.playerRadius;
    const b = this.map.bounds;
    if (x - r < b.x || x + r > b.x + b.width || y - r < b.y || y + r > b.y + b.height) return false;
    return !this.map.obstacles.some((o: Rect) => {
      const nearX = Math.max(o.x, Math.min(x, o.x + o.width));
      const nearY = Math.max(o.y, Math.min(y, o.y + o.height));
      return (x - nearX) ** 2 + (y - nearY) ** 2 < r * r;
    });
  }

  update(input: Vec2, dt: number) {
    const magnitude = Math.hypot(input.x, input.y);
    if (magnitude < 0.001) { this.stop(); return; }
    if (Math.abs(input.x) > Math.abs(input.y) + 0.05) this.direction = input.x > 0 ? 'right' : 'left';
    else this.direction = input.y > 0 ? 'front' : 'back';
    const dx = input.x / Math.max(1, magnitude) * CONFIG.speed * dt;
    const dy = input.y / Math.max(1, magnitude) * CONFIG.speed * dt;
    const oldX = this.x; const oldY = this.y;
    // Small substeps prevent tunnelling, while separate axes allow wall sliding.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
    for (let i = 0; i < steps; i++) {
      if (this.canStand(this.x + dx / steps, this.y)) this.x += dx / steps;
      if (this.canStand(this.x, this.y + dy / steps)) this.y += dy / steps;
    }
    const distance = Math.hypot(this.x - oldX, this.y - oldY);
    this.motion = distance > 0.001 ? 'walk' : 'idle';
    // Foot cadence follows actual travel, including slow joystick input/wall sliding.
    this.animationTime = this.motion === 'walk' ? this.animationTime + distance / CONFIG.speed : 0;
  }
  stop() { this.motion = 'idle'; this.animationTime = 0; }
}
