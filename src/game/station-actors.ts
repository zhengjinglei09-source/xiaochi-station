import { platforms, attendant, type Platform } from '../content/station-content';
import type { Interaction } from '../systems/interaction';
import { NpcRenderer, type NpcId } from '../assets/npc';

const rect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
};
function text(c: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string) {
  c.fillStyle = color; c.font = `bold ${size}px "Songti SC", serif`; c.fillText(value, x, y);
}

export function drawTrains(c: CanvasRenderingContext2D, npcs: NpcRenderer) {
  for (const platform of platforms) {
    const { x, route } = platform;
    rect(c, x - 52, 89, 106, 53, '#3f5655');
    rect(c, x - 49, 87, 100, 5, '#aab9a8');
    rect(c, x - 50, 94, 102, 47, '#e7dfc5');
    rect(c, x - 50, 123, 102, 10, route.color);
    // A name plate, window and doorway make each stop identifiable on the same track.
    rect(c, x - 49, 92, 100, 15, '#354f4e');
    c.save(); c.textAlign = 'center';
    text(c, route.trainName, x, 103, 11, '#fff0c4');
    c.restore();
    rect(c, x - 42, 110, 18, 11, '#658a91'); rect(c, x - 40, 111, 7, 2, '#b9d3cf');
    rect(c, x + 27, 110, 17, 11, '#658a91'); rect(c, x + 29, 111, 8, 2, '#b9d3cf');
    rect(c, x - 15, 108, 30, 34, '#3c5554'); rect(c, x - 11, 110, 22, 30, '#708983');
    rect(c, x - 9, 112, 8, 13, '#b5cdca'); rect(c, x + 2, 112, 7, 13, '#b5cdca');
    rect(c, x - 1, 110, 2, 29, '#425e5a'); rect(c, x - 16, 140, 32, 3, '#f4de9f');
    rect(c, x - 18, 143, 36, 7, '#d1baa0'); rect(c, x - 16, 144, 32, 2, '#f8e7bc');
    npcs.drawConductorWindow(c, x + 27, 110);
  }
}

export function drawRouteSign(c: CanvasRenderingContext2D, platform: Platform) {
  const { x, y } = platform.sign;
  rect(c, x - 1, y - 15, 3, 18, '#586c61');
  rect(c, x - 14, y - 30, 29, 20, '#425c58'); rect(c, x - 12, y - 28, 25, 16, '#fbebc7');
  c.save(); c.textAlign = 'center'; text(c, String(platform.number).padStart(2, '0'), x, y - 17, 10, platform.route.color); c.restore();
  rect(c, x - 5, y + 2, 12, 2, '#526b5f');
}

interface Commuter { id: string; sprite: NpcId; x: number; y: number; speed: number; phrase: string }
export class StationActors {
  private time = 0;
  readonly renderer = new NpcRenderer();
  load() { return this.renderer.load(); }
  readonly commuters: Commuter[] = [
    { id: 'graduate-cv', sprite: 'commuter-cv', x: 80, y: 287, speed: 43, phrase: '秋招开始了！' },
    { id: 'graduate-book', sprite: 'commuter-book', x: 535, y: 317, speed: -37, phrase: '我自习室要没位置了。' },
    { id: 'graduate-ddl', sprite: 'commuter-ddl', x: 390, y: 338, speed: 52, phrase: 'DDL要到了！' },
  ];
  update(dt: number) {
    this.time += dt;
    for (const person of this.commuters) {
      person.x += person.speed * dt;
      if (person.x > 722) person.x = -42;
      if (person.x < -42) person.x = 722;
    }
  }
  layers(reducedMotion: boolean, greeting: boolean) {
    return [
      { y: attendant.y, draw: (c: CanvasRenderingContext2D) => this.renderer.draw(c, 'conductor', attendant.x, attendant.y, greeting && !reducedMotion && Math.floor(this.time * 1.5) % 3 !== 0 ? 1 : 0) },
      ...this.commuters.map((person, index) => ({ y: person.y, draw: (c: CanvasRenderingContext2D) =>
        this.renderer.draw(c, person.sprite, person.x, person.y, reducedMotion ? 0 : Math.floor(this.time * 4 + index) % 2, Math.sign(person.speed)) })),
    ];
  }
  drawBubble(c: CanvasRenderingContext2D, cameraX: number, width: number) {
    // Only one short ambient bubble at a time; it never opens a dialogue or blocks input.
    if (this.time % 5 > 2.1) return;
    const index = Math.floor(this.time / 5) % this.commuters.length;
    const person = this.commuters[index];
    if (person.x < cameraX + 25 || person.x > cameraX + width - 25) return;
    c.font = '10px "Songti SC", serif';
    const w = Math.ceil(c.measureText(person.phrase).width) + 12;
    const x = Math.max(cameraX + 4, Math.min(cameraX + width - w - 4, person.x - w / 2));
    const y = person.y - 84;
    rect(c, x - 1, y - 1, w + 2, 20, '#66756b'); rect(c, x, y, w, 18, '#fcf0d5');
    rect(c, person.x - 2, y + 18, 4, 3, '#fcf0d5');
    text(c, person.phrase, x + 6, y + 12, 10, '#495d54');
  }
}

export function drawInteractionHighlight(c: CanvasRenderingContext2D, interaction: Interaction | null, time: number, reducedMotion: boolean) {
  if (!interaction) return;
  const { x, y } = interaction.target.position;
  const offset = reducedMotion ? 0 : Math.floor(time * 2) % 2;
  const color = '#fff1aa';
  for (const sign of [-1, 1]) {
    rect(c, x + sign * (15 + offset) - 1, y - 4, 2, 8, color);
    rect(c, x + (sign < 0 ? -15 - offset : 10 + offset), y + 3, 6, 2, color);
  }
}
