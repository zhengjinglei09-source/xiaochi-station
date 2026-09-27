import type { Rect, Vec2 } from '../game/config';
import type { LocationId } from '../systems/events';
export interface LifeObject { id: string; name: string; x: number; y: number; kind: 'door' | 'computer' | 'phone' | 'friend' | 'reading' | 'bed'; to?: LocationId }
export interface LifeMap { name: string; subtitle: string; bounds: Rect; obstacles: Rect[]; spawn: Vec2; objects: LifeObject[] }
const bounds = { x: 16, y: 108, width: 328, height: 252 };
export const lifeMaps: Record<LocationId, LifeMap> = {
  campus: { name: '校园', subtitle: '九月 · 风里还有夏天', bounds, spawn: { x: 180, y: 320 },
    obstacles: [{ x: 28, y: 225, width: 62, height: 55 }, { x: 274, y: 225, width: 62, height: 55 }, { x: 117, y: 233, width: 53, height: 18 }],
    objects: [{ id: 'dorm-door', name: '回宿舍', kind: 'door', x: 65, y: 142, to: 'dorm' }, { id: 'library-door', name: '去图书馆', kind: 'door', x: 290, y: 142, to: 'library' }, { id: 'friend', name: '和朋友聊天', kind: 'friend', x: 224, y: 280 }] },
  dorm: { name: '宿舍', subtitle: '四个人的房间 · 靠窗的书桌', bounds, spawn: { x: 180, y: 320 },
    obstacles: [{ x: 32, y: 120, width: 83, height: 105 }, { x: 222, y: 145, width: 90, height: 25 }, { x: 150, y: 192, width: 30, height: 18 }],
    objects: [{ id: 'exit', name: '去校园', kind: 'door', x: 180, y: 342, to: 'campus' }, { id: 'computer', name: '打开电脑', kind: 'computer', x: 267, y: 194 }, { id: 'phone', name: '看看手机', kind: 'phone', x: 165, y: 233 }, { id: 'bed', name: '坐一会儿', kind: 'bed', x: 90, y: 250 }] },
  library: { name: '图书馆', subtitle: '靠窗自习区 · 请轻声', bounds, spawn: { x: 180, y: 320 },
    obstacles: [{ x: 34, y: 105, width: 130, height: 32 }, { x: 219, y: 145, width: 98, height: 25 }, { x: 66, y: 234, width: 128, height: 22 }],
    objects: [{ id: 'exit', name: '去校园', kind: 'door', x: 180, y: 342, to: 'campus' }, { id: 'computer', name: '使用公共电脑', kind: 'computer', x: 267, y: 194 }, { id: 'reading', name: '坐到自习桌前', kind: 'reading', x: 126, y: 280 }] },
};
export function drawLifeMap(c: CanvasRenderingContext2D, id: LocationId, night: boolean) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const text = (s: string, x: number, y: number, color = '#455e57', size = 12) => { c.fillStyle = color; c.font = `600 ${size}px "PingFang SC", sans-serif`; c.textAlign = 'center'; c.fillText(s, x, y); c.textAlign = 'left'; };
  const window = (x: number, y: number, w: number) => {
    rect(x, y, w, 44, '#536e69'); rect(x + 3, y + 3, w - 6, 38, night ? '#e5c883' : '#bddce0');
    rect(x + w / 2 - 1, y, 3, 44, '#fff0d2'); rect(x, y + 23, w, 3, '#fff0d2'); rect(x + 7, y + 7, 4, 12, '#e8f3e8');
  };
  const desk = (x: number, y: number, w: number) => {
    rect(x + 3, y + 8, w, 25, '#6f6553'); rect(x, y, w, 18, '#ae865d'); rect(x + 3, y + 3, w - 6, 4, '#e2ba82');
    rect(x + 5, y + 18, 5, 18, '#705c49'); rect(x + w - 9, y + 18, 5, 18, '#705c49');
  };
  const computer = (x: number, y: number) => {
    desk(x - 38, y + 23, 90); rect(x - 19, y - 10, 43, 31, '#45585c'); rect(x - 16, y - 7, 37, 24, '#b6d3b3');
    rect(x - 10, y - 2, 22, 2, '#edf2cd'); rect(x - 10, y + 4, 28, 2, '#799e93'); rect(x - 10, y + 10, 17, 2, '#799e93');
    rect(x, y + 21, 5, 7, '#45585c'); rect(x - 13, y + 29, 33, 4, '#e7ddc1');
  };
  rect(0, 0, 360, 390, id === 'campus' ? '#aac5a1' : '#b8ad92');
  rect(12, 96, 336, 266, id === 'campus' ? '#e5d9b9' : '#e4d5b6');
  for (let y = 104; y < 360; y += 23) for (let x = 14 + (y % 2 ? 0 : -15); x < 344; x += 42) {
    rect(x, y, 40, 21, (x + y) % 3 ? '#e9dfc6' : '#dcd1b4'); rect(x, y, 40, 1, '#f6edd4');
  }
  if (id === 'campus') {
    // Two entrances share one small courtyard, with no route-specific scenery.
    for (const [x, name] of [[20, '宿舍'], [244, '图书馆']] as const) {
      rect(x, 26, 96, 101, '#7e9182'); rect(x + 4, 31, 88, 90, '#e9d6ad'); rect(x - 4, 23, 104, 10, '#55776d');
      window(x + 10, 44, 29); window(x + 54, 44, 29);
      rect(x + 31, 87, 32, 42, '#516864'); rect(x + 36, 93, 22, 36, '#a7c2b9'); rect(x + 45, 94, 2, 35, '#53736d');
      rect(x + 18, 6, 61, 20, '#fff0ce'); text(name, x + 48, 21);
    }
    rect(129, 55, 93, 26, '#fcf0d5'); text('27届 · 新学期', 175, 73, '#7a7861', 11);
    for (const x of [29, 275]) {
      rect(x, 225, 61, 55, '#728e68'); rect(x + 3, 228, 55, 48, '#8eae78'); rect(x + 25, 208, 9, 35, '#8d7251');
      rect(x + 9, 181, 41, 31, '#4c7b61'); rect(x + 3, 192, 55, 27, '#67946d'); rect(x + 12, 184, 22, 9, '#97b57c');
      for (let i = 0; i < 8; i++) rect(x + 6 + i * 6, 258 + i % 3 * 4, 3, 3, '#e8d78e');
    }
    desk(117, 227, 53); rect(114, 218, 59, 5, '#cfa978');
    text('← 宿舍     图书馆 →', 180, 186, '#7c8874', 10);
  } else {
    rect(12, 9, 336, 96, '#d9c9a8'); rect(12, 99, 336, 7, '#a59171'); window(228, 24, 86);
    rect(222, 24, 6, 71, '#899f8c'); rect(314, 24, 7, 71, '#899f8c');
    if (id === 'dorm') {
      rect(30, 89, 87, 140, '#846d55'); rect(36, 95, 75, 126, '#f7edd6'); rect(40, 123, 67, 94, '#8da7b0');
      rect(40, 98, 66, 26, '#fff5e5'); rect(43, 144, 61, 3, '#c6d3ce'); rect(43, 190, 61, 3, '#c6d3ce');
      rect(144, 54, 48, 39, '#a9977c'); rect(148, 58, 40, 31, '#fff2d4'); text('9月', 168, 79);
      desk(150, 190, 30); rect(158, 184, 13, 20, '#4e5d60'); rect(160, 186, 9, 14, '#bbd6ba');
      computer(260, 119); text('小迟的书桌', 265, 105, '#667969', 10);
      text('床', 75, 243, '#8a826e', 10);
    } else {
      rect(31, 33, 136, 104, '#807257');
      for (let row = 0; row < 3; row++) {
        rect(35, 39 + row * 31, 128, 25, '#5e6556');
        for (let book = 0; book < 17; book++) { const h = 15 + book % 3 * 3; rect(38 + book * 7, 64 + row * 31 - h, 5, h, ['#af8e6b', '#9ca992', '#c5b88b', '#739493'][book % 4]); }
      }
      computer(257, 119); desk(66, 232, 128);
      rect(94, 226, 46, 17, '#ffefd0'); rect(117, 227, 1, 14, '#ad9d7e');
      for (let i = 0; i < 3; i++) rect(98, 230 + i * 4, 14, 1, '#b4aa8a');
      rect(169, 221, 8, 16, '#729c94'); text('自习桌', 129, 211, '#667969', 10);
    }
    rect(151, 355, 58, 7, '#a98b60'); text('↓ 校园', 180, 382, '#526d62', 11);
  }
  if (night) { rect(0, 0, 360, 390, '#3d526a24'); rect(224, 23, 96, 73, '#fff0b512'); }
  for (let i = 0; i < 36; i++) { const x = i * 29 % 360, y = 367 + i * 13 % 20; rect(x, y, 2, 3, id === 'campus' ? '#73956e' : '#b6a589'); }
}
