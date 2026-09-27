import { CONFIG, type Direction, type Motion } from '../game/config';
import type { Player } from '../game/player';

interface Clip { frames: string[]; fps: number; flipX?: boolean; provisional: boolean }
export const characterClips: Record<Motion, Record<Direction, Clip>> = {
  idle: {
    front: { frames: ['front'], fps: 1, provisional: true },
    back: { frames: ['back'], fps: 1, provisional: true },
    left: { frames: ['left'], fps: 1, provisional: true },
    right: { frames: ['left'], fps: 1, flipX: true, provisional: true },
  },
  walk: {
    front: { frames: ['front'], fps: 7, provisional: true },
    back: { frames: ['back'], fps: 7, provisional: true },
    left: { frames: ['walk-right'], fps: 7, flipX: true, provisional: true },
    right: { frames: ['walk-right'], fps: 7, provisional: true },
  },
};
export class CharacterRenderer {
  private images = new Map<string, HTMLImageElement>();
  async load() {
    await Promise.all(['front', 'back', 'left', 'walk-right'].map(async name => {
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}assets/character/${name}.png`;
      await image.decode(); this.images.set(name, image);
    }));
  }
  draw(ctx: CanvasRenderingContext2D, player: Player, reducedMotion: boolean) {
    const clip = characterClips[player.motion][player.direction];
    const frame = clip.frames[Math.floor(player.animationTime * clip.fps) % clip.frames.length];
    const image = this.images.get(frame);
    if (!image) return;
    const walk = player.motion === 'walk';
    const height = CONFIG.characterHeight;
    const width = Math.round(height * image.width / image.height);
    const phase = player.animationTime * Math.PI * 2 * CONFIG.walkCycleHz;
    const stride = walk ? Math.sin(phase) : 0;
    const bob = walk && !reducedMotion ? -Math.round(Math.abs(Math.sin(phase)) * 2) : 0;
    ctx.fillStyle = '#46594d30';
    ctx.fillRect(Math.round(player.x - 16), Math.round(player.y - 3), 32, 5);
    ctx.fillRect(Math.round(player.x - 11), Math.round(player.y + 2), 22, 2);
    ctx.save(); ctx.translate(Math.round(player.x), Math.round(player.y));
    if (clip.flipX) ctx.scale(-1, 1);
    if (!walk) {
      ctx.drawImage(image, -Math.round(width / 2), -height, width, height);
    } else {
      this.drawStride(ctx, image, width, height, stride, bob, player.direction, reducedMotion);
    }
    ctx.restore();
  }

  private drawStride(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, stride: number, bob: number, direction: Direction, reducedMotion: boolean) {
    // Art-preserving cutout animation: articulate the existing trouser/shoe pixels.
    // No repainting of face, hair, clothes or backpack. Future authored clips
    // can replace this provisional gait without changing movement/collision code.
    const side = direction === 'left' || direction === 'right';
    const hipY = Math.round(image.height * (side ? .72 : .74));
    const legSourceHeight = image.height - hipY;
    const hipDestY = -height + Math.round(hipY / image.height * height);
    const legHeight = -hipDestY;
    const split = Math.round(image.width * .5);
    const left = -Math.round(width / 2);
    const amount = reducedMotion ? .55 : 1;

    if (side) {
      // The two rotated side-view legs separate at the crotch. Keep a small
      // patch of the original trouser pixels behind them to bridge that seam.
      // This is covered by the moving legs and does not alter their stride.
      ctx.drawImage(image, split - 7, hipY + 3, 14, 10, -8, hipDestY + bob + 3, 16, 13);
    }

    // Draw the receding leg first so the stepping leg reads in front.
    const order = stride > 0 ? [0, 1] : [1, 0];
    for (const leg of order) {
      const sx = leg === 0 ? 0 : split;
      const sw = leg === 0 ? split : image.width - split;
      const dw = sw / image.width * width;
      const swing = stride * (leg === 0 ? 1 : -1) * amount;
      const footLift = Math.max(0, swing) * (side ? 3 : 4);
      ctx.save();
      ctx.translate(left + (leg === 0 ? 0 : split / image.width * width) + dw / 2, hipDestY + bob);
      ctx.rotate(swing * (side ? .24 : .1));
      ctx.drawImage(image, sx, hipY, sw, legSourceHeight, -dw / 2, 0, dw, legHeight - footLift);
      ctx.restore();
    }
    // Overlap at the hips hides seams as the legs swing in opposite directions.
    const overlap = 4;
    ctx.save();
    ctx.translate(Math.round(stride * amount), bob);
    ctx.rotate(side ? -.025 * amount : stride * .018 * amount);
    ctx.drawImage(image, 0, 0, image.width, hipY + overlap, left, -height, width, (hipY + overlap) / image.height * height);
    ctx.restore();
  }
}
