import { station } from './station';
import type { Rect } from './config';

const C = { ink: '#465a58', dark: '#3e5455', wood: '#b7865e', lightWood: '#ddb784', cream: '#f8e9c8', green: '#6e9272' };
function rect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, size = 10, color = C.ink) { c.fillStyle = color; c.font = `bold ${size}px "Songti SC", "STSong", serif`; c.fillText(text, x, y); }
function noise(x: number, y: number) { return ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1; }

function foliage(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const colors = ['#527b64', '#6d926a', '#8ba66d', '#abc083', '#c3cf91'];
  for (let j = -size; j < size; j += 3) for (let i = -size; i < size; i += 3) {
    const n = noise(x + i, y + j);
    if (i * i + j * j < size * size * (.72 + n * .3)) rect(c, x + i, y + j, 4, 4, colors[Math.min(4, Math.floor(n * 3 + (size - j) / size))]);
  }
}

export function drawBackdrop(c: CanvasRenderingContext2D, width: number, height: number, origin: number, cameraX: number) {
  rect(c, 0, 0, width, height, '#e4dbc4');
  rect(c, 0, 0, width, origin + 100, '#aed1d8');
  rect(c, 0, 0, width, 135, '#cce0dc');
  // Stepped clouds, a quiet distant town, and dense green street trees.
  for (let i = -1; i < 5; i++) {
    const x = i * 112 - cameraX * .18;
    rect(c, x, 150, 56, 7, '#eff0d9'); rect(c, x + 9, 140, 30, 10, '#eff0d9'); rect(c, x + 17, 135, 17, 8, '#f8f0d9');
  }
  for (let i = -1; i < 13; i++) {
    const x = i * 40 - (cameraX * .28 % 40), h = 36 + Math.floor(noise(i, 3) * 58);
    rect(c, x, origin + 26 - h, 32, h, i % 2 ? '#8bafb5' : '#a3bec1');
    rect(c, x + 4, origin + 22 - h, 24, 3, '#d0d6c6');
    rect(c, x + 29, origin + 26 - h, 3, h, '#83a4a9');
    for (let row = 0; row < h - 12; row += 12) for (let col = 0; col < 3; col++) {
      rect(c, x + 5 + col * 9, origin + 32 - h + row, 4, 6, '#dce0c7');
      rect(c, x + 5 + col * 9, origin + 38 - h + row, 5, 1, '#7e9da0');
    }
  }
  for (let x = -40; x < width + 60; x += 43) {
    rect(c, x - cameraX * .06 % 43, origin + 12, 4, 62, '#7e8870');
    foliage(c, x - cameraX * .06 % 43, origin + 29, 29);
  }
}

export function drawGround(c: CanvasRenderingContext2D, height: number) {
  // Parallel railway lines and sleepers, behind the walkable platform.
  rect(c, 0, 76, 680, 73, '#7e8c88');
  for (let x = 0; x < 680; x += 18) { rect(c, x, 88, 7, 51, '#626f6b'); rect(c, x + 1, 91, 2, 44, '#909b8e'); }
  for (const y of [96, 123]) { rect(c, 0, y, 680, 5, '#445b5a'); rect(c, 0, y, 680, 2, '#c1ccbb'); }
  rect(c, 0, 139, 680, height, '#d8cdb4');
  for (let y = 163; y < height; y += 24) for (let x = -24; x < 700; x += 32) {
    const offset = Math.floor(y / 24) % 2 * 16;
    rect(c, x + offset, y, 31, 23, ['#e2d7bf', '#dbd0b8', '#e8ddc6'][Math.floor(noise(x, y) * 3)]);
    rect(c, x + offset + 1, y + 1, 29, 1, '#eee3cc');
    if (noise(x, y) > .85) rect(c, x + offset + 5, y + 17, 4, 1, '#c5baa4');
  }
  rect(c, 0, 140, 680, 4, '#f7edcd');
  rect(c, 0, 146, 680, 12, '#dcb45e');
  for (let x = 0; x < 680; x += 8) { rect(c, x + 2, 148, 2, 2, '#f5db91'); rect(c, x + 2, 153, 2, 2, '#a88c4d'); }
  rect(c, 0, 159, 680, 3, '#ac9a75');
  // A modest foreground fence establishes the lower walking boundary.
  for (let x = 16; x <= 662; x += 43) {
    rect(c, x + 4, 375, 5, 22, '#b2ae91');
    rect(c, x, 359, 5, 26, '#668276'); rect(c, x, 359, 2, 26, '#a7b9a0');
  }
  rect(c, 18, 368, 640, 4, '#6e8b7c'); rect(c, 18, 367, 640, 1, '#b6c4a5');
  for (const x of [18, 659]) {
    rect(c, x - 10, 163, 10, 205, '#94a389');
    for (let y = 174; y < 350; y += 25) foliage(c, x - 5, y, 10);
  }
  // Walking lane markings are environmental details, not HUD controls.
  for (const x of [85, 335, 590]) {
    rect(c, x, 311, 18, 3, '#f7ecd1'); rect(c, x + 14, 308, 4, 9, '#f7ecd1'); rect(c, x + 18, 310, 3, 5, '#f7ecd1');
  }
  // Foreground station garden fills extra-tall phone viewports naturally.
  rect(c, 0, 393, 680, Math.max(0, height - 393), '#c4cba2');
  rect(c, 0, 390, 680, 4, '#a8ad88');
  rect(c, 0, 394, 680, 3, '#e0d5af');
  for (let y = 403; y < height; y += 9) for (let x = 0; x < 680; x += 8) {
    const n = noise(x, y);
    if (n > .4) { rect(c, x, y, 1, 3, '#9baa80'); rect(c, x + 2, y + 1, 1, 2, '#dce0b0'); }
    if (n > .94) { rect(c, x, y - 1, 3, 2, '#f2e7bd'); rect(c, x + 1, y - 2, 1, 1, '#cead65'); }
  }
  for (let x = 8; x < 680; x += 30) foliage(c, x, 411 + Math.round(noise(x, 5) * 8), 17);
  label(c, '01', 306, 192, 17, '#b6a885');
}

export function drawArchitecture(c: CanvasRenderingContext2D) {
  // The open station canopy frames the tracks; no route or train logic.
  for (let x = 44; x < 680; x += 194) {
    rect(c, x + 7, 37, 9, 105, '#566e69'); rect(c, x + 7, 39, 3, 102, '#a8b8a3');
    rect(c, x + 3, 139, 17, 5, '#526963');
    rect(c, x - 7, 35, 35, 5, '#68847a');
    rect(c, x + 14, 83, 22, 2, '#586961');
    rect(c, x + 32, 82, 5, 18, '#596d65'); rect(c, x + 30, 85, 9, 9, '#f5df94');
    rect(c, x + 31, 86, 7, 5, '#fff1b8');
  }
  rect(c, 0, 13, 680, 21, '#62867f'); rect(c, 0, 13, 680, 4, '#98b0a0');
  for (let x = 0; x < 680; x += 24) { rect(c, x, 18, 2, 13, '#456861'); rect(c, x + 3, 18, 1, 10, '#9bb3a0'); }
  rect(c, 0, 34, 680, 5, '#3f645e'); rect(c, 0, 39, 680, 2, '#e0cca0');
  rect(c, 291, 41, 2, 13, '#576c61'); rect(c, 388, 41, 2, 13, '#576c61');
  rect(c, 277, 53, 127, 32, '#3e5956'); rect(c, 280, 56, 121, 26, '#f4e6c2');
  label(c, '人生车站', 293, 74, 15); label(c, '↗', 380, 74, 16);
  // Clock without a simulated time system.
  rect(c, 459, 44, 2, 9, '#435b57'); rect(c, 449, 53, 23, 25, '#465d59'); rect(c, 451, 55, 19, 21, '#efe3c2');
  rect(c, 459, 58, 2, 10, '#56615a'); rect(c, 460, 66, 6, 2, '#56615a');
  // Distant station notice, with whimsical but non-interactive scenery copy.
  rect(c, 110, 52, 102, 28, '#46645f'); rect(c, 112, 54, 98, 24, '#344e4c');
  label(c, '下一站：未完待续', 118, 70, 10, '#ebcd83');
}

export function drawObject(c: CanvasRenderingContext2D, o: Rect & { kind: string }) {
  const { x, y, width: w } = o;
  rect(c, x + 4, y + 9, w + 5, 14, '#58685825');
  if (o.kind === 'bench') {
    rect(c, x + 4, y - 9, 5, 29, C.dark); rect(c, x + w - 10, y - 9, 5, 29, C.dark);
    rect(c, x, y - 19, w, 21, '#6e6653');
    for (let i = 0; i < 3; i++) { rect(c, x + 2, y - 17 + i * 7, w - 4, 5, C.wood); rect(c, x + 3, y - 17 + i * 7, w - 6, 1, C.lightWood); }
    rect(c, x - 2, y + 3, w + 4, 8, '#977250'); rect(c, x - 2, y + 3, w + 4, 2, '#e2bb81');
    rect(c, x - 3, y - 1, 3, 11, C.dark); rect(c, x + w, y - 1, 3, 11, C.dark);
  } else if (o.kind === 'plant') {
    rect(c, x + 2, y + 1, w - 4, 19, '#b88662'); rect(c, x, y, w, 5, '#dbb183'); rect(c, x + 5, y + 6, 3, 12, '#d5a880');
    foliage(c, x + 12, y - 8, 19);
    for (let i = 0; i < 5; i++) { const fx = x - 2 + i * 6, fy = y - 12 + i % 2 * 6; rect(c, fx, fy, 4, 4, '#e9c06d'); rect(c, fx + 1, fy + 1, 2, 2, '#fff0bd'); }
  } else if (o.kind === 'notice') {
    rect(c, x + 3, y - 20, 4, 34, C.dark); rect(c, x + w - 7, y - 20, 4, 34, C.dark);
    rect(c, x - 2, y - 48, w + 4, 41, '#587269'); rect(c, x + 1, y - 45, w - 2, 34, '#c4a878');
    rect(c, x + 4, y - 42, 17, 25, '#f7eace'); rect(c, x + 24, y - 40, 12, 14, '#b8c9bc');
    label(c, '站讯', x + 5, y - 32, 8); for (let j = 0; j < 3; j++) rect(c, x + 6, y - 27 + j * 3, 12, 1, '#aaa387');
  }
}

export function drawAmbient(c: CanvasRenderingContext2D, t: number, reducedMotion: boolean) {
  for (let i = 0; i < 7; i++) {
    const x = (i * 97 + (reducedMotion ? 0 : t * 7)) % 660;
    const y = 238 + Math.sin(i * 8 + (reducedMotion ? 0 : t * .7)) * 82;
    rect(c, x, y, 3, 2, '#b9a96e'); rect(c, x + 2, y - 1, 2, 1, '#d4bd79');
  }
  // A short string of pennants gently changes shape in the station breeze.
  rect(c, 20, 43, 220, 1, '#657e6c');
  for (let i = 0; i < 10; i++) {
    const x = 24 + i * 23; const sway = reducedMotion ? 0 : Math.round(Math.sin(t * 2 + i));
    rect(c, x, 44, 9, 5, ['#c9946c', '#a8b985', '#83aaa5'][i % 3]);
    rect(c, x + 2 + sway, 49, 5, 4, ['#c9946c', '#a8b985', '#83aaa5'][i % 3]);
  }
}

export { station };
