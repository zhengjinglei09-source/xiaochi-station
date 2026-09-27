import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Index generated PNGs without repainting, resizing or modifying their pixels.
// Feet anchors keep the character stable when one frame raises a hand.
const definitions = [['conductor', 83], ['commuter-cv', 78], ['commuter-book', 79], ['commuter-ddl', 82]];
const sprites = {};
for (const [id, displayHeight] of definitions) {
  const { data, info } = await sharp(`public/assets/npc/${id}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frames = [];
  for (let frame = 0; frame < 2; frame++) {
    const start = Math.floor(info.width * frame / 2), end = Math.floor(info.width * (frame + 1) / 2);
    let left = end, right = start, top = info.height, bottom = 0;
    for (let y = 0; y < info.height; y++) for (let x = start; x < end; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 200) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (left > right || top >= bottom) throw new Error(`Missing opaque sprite: ${id}/${frame}`);
    let footLeft = right, footRight = left;
    for (let y = bottom - Math.floor((bottom - top) * .06); y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 200) continue;
      footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x);
    }
    frames.push({ x: left, y: top, width: right - left + 1, height: bottom - top + 1, anchorX: (footLeft + footRight) / 2 - left });
  }
  sprites[id] = { file: `${id}.png`, displayHeight, frames };
}
await writeFile('public/assets/npc/atlas.json', JSON.stringify(sprites, null, 2) + '\n');
console.log('Indexed four original NPC sheets; PNG pixels unchanged.');
