import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

// Exact source crops, without generative repainting. Source labels/UI are excluded.
const source = 'docs/reference-character.png';
const crops = {
  front: { left: 1187, top: 53, width: 77, height: 129 },
  left: { left: 1270, top: 60, width: 66, height: 122 },
  back: { left: 1340, top: 53, width: 71, height: 129 },
  'walk-right': { left: 1414, top: 54, width: 92, height: 129 },
};
await mkdir('public/assets/character', { recursive: true });
for (const [name, crop] of Object.entries(crops)) {
  const { data, info } = await sharp(source).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height); const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    const i = p * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
    // Flood-fill only light warm background connected to the crop border.
    // Enclosed shirt, skin, glasses and bag pixels remain intact.
    if (r > 181 && g > 151 && b > 113 && r >= g && g >= b && r - b < 100) queue.push(p);
  };
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
  for (let q = 0; q < queue.length; q++) {
    const p = queue[q]; data[p * 4 + 3] = 0;
    const x = p % width, y = Math.floor(p / width);
    enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
  }
  await sharp(data, { raw: { width, height, channels: 4 } }).trim().png().toFile(`public/assets/character/${name}.png`);
}
await writeFile('public/assets/character/provenance.json', JSON.stringify({ source: '用户提供：人物素材/风格2.png，右上角人物设定区域', method: '精确裁切，边界连通背景去底；未生成、重画角色', crops }, null, 2));
console.log('Extracted four original character poses.');
