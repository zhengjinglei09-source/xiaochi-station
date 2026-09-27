import type { Vec2 } from '../game/config';

export type InteractionType = 'npc' | 'sign' | 'train';
export interface Interaction {
  id: string;
  type: InteractionType;
  target: { id: string; position: Vec2 };
  range: number;
  prompt: string;
  icon: 'talk' | 'view' | 'board';
  action: () => void;
}
export class InteractionSystem {
  current: Interaction | null = null;
  constructor(readonly items: readonly Interaction[]) {}

  update(position: Vec2, enabled = true) {
    if (!enabled) { this.current = null; return null; }
    const distance = (item: Interaction) => Math.hypot(position.x - item.target.position.x, position.y - item.target.position.y);
    const candidates = this.items.filter(item => distance(item) <= item.range)
      .sort((a, b) => distance(a) - distance(b) || a.id.localeCompare(b.id));
    const nearest = candidates[0] ?? null;
    // Avoid flickering between two nearby targets; the old target must still be in range.
    if (!this.current || !candidates.includes(this.current) || (nearest && distance(nearest) + 6 < distance(this.current))) {
      this.current = nearest;
    }
    return this.current;
  }
  activate(position: Vec2, enabled = true) {
    // Re-check at click time so a stale visible button cannot activate a distant object.
    this.update(position, enabled)?.action();
  }
}
