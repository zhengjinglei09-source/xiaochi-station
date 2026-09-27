import type { Platform } from '../content/station-content';
import type { Player } from './player';
import { CONFIG } from './config';

export class BoardingSequence {
  progress = 0;
  private startX: number;
  private startY: number;
  readonly duration = 1.25;
  constructor(readonly platform: Platform, private player: Player) {
    this.startX = player.x; this.startY = player.y;
    player.stop();
  }
  update(dt: number) {
    this.progress = Math.min(1, this.progress + dt / this.duration);
    const walk = Math.min(1, this.progress / .72);
    const align = Math.min(1, walk / .42);
    const approach = Math.max(0, (walk - .42) / .58);
    const oldX = this.player.x, oldY = this.player.y;
    // Align with the clear doorway, then cross the platform edge in a controlled cutscene.
    this.player.x = this.startX + (this.platform.door.x - this.startX) * align;
    this.player.y = this.startY + (this.platform.door.y - this.startY) * approach;
    this.player.direction = approach > 0 ? 'back' : this.player.x >= oldX ? 'right' : 'left';
    const distance = Math.hypot(this.player.x - oldX, this.player.y - oldY);
    this.player.motion = distance > .001 ? 'walk' : 'idle';
    this.player.animationTime += distance / CONFIG.speed;
    if (this.progress === 1) this.player.stop();
    return this.progress === 1;
  }
  get opacity() { return 1 - Math.max(0, (this.progress - .58) / .42); }
}
