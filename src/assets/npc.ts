export type NpcId = 'conductor' | 'commuter-cv' | 'commuter-book' | 'commuter-ddl';
interface SpriteFrame { x: number; y: number; width: number; height: number; anchorX: number }
interface Sprite { file: string; displayHeight: number; frames: SpriteFrame[] }

export class NpcRenderer {
  private sprites: Record<NpcId, Sprite> | null = null;
  private images = new Map<NpcId, HTMLImageElement>();
  async load() {
    const base = `${import.meta.env.BASE_URL}assets/npc/`;
    const response = await fetch(`${base}atlas.json`);
    if (!response.ok) throw new Error('NPC atlas could not be loaded');
    this.sprites = await response.json();
    await Promise.all(Object.entries(this.sprites!).map(async ([id, sprite]) => {
      const image = new Image(); image.src = base + sprite.file;
      await image.decode(); this.images.set(id as NpcId, image);
    }));
  }
  draw(c: CanvasRenderingContext2D, id: NpcId, x: number, y: number, frameIndex = 0, facing = 1) {
    const sprite = this.sprites?.[id], image = this.images.get(id);
    if (!sprite || !image) return;
    const frame = sprite.frames[frameIndex % sprite.frames.length];
    const scale = sprite.displayHeight / Math.max(...sprite.frames.map(frame => frame.height));
    c.fillStyle = '#46594d28'; c.fillRect(Math.round(x - 12), Math.round(y - 2), 24, 4);
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(facing, 1);
    c.imageSmoothingEnabled = false;
    c.drawImage(image, frame.x, frame.y, frame.width, frame.height,
      -Math.round(frame.anchorX * scale), -Math.round(frame.height * scale), Math.round(frame.width * scale), Math.round(frame.height * scale));
    c.restore();
  }
  drawConductorWindow(c: CanvasRenderingContext2D, x: number, y: number) {
    const sprite = this.sprites?.conductor, image = this.images.get('conductor');
    if (!sprite || !image) return;
    const frame = sprite.frames[0];
    // The same authored cap and face, cropped into the existing tiny train window.
    c.save(); c.beginPath(); c.rect(x, y, 17, 11); c.clip(); c.imageSmoothingEnabled = false;
    c.drawImage(image, frame.x, frame.y, frame.width, frame.height * .49, x + 1, y - 1, 15, 15);
    c.restore();
  }
}
