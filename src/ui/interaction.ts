import { onPress } from './press';
export type InteractionTarget = { label: string; verb?: string; icon: 'talk' | 'view' | 'board'; onInteract: () => void };

// One contextual control; target selection and game actions live outside the view.
export class InteractionButton {
  private abort = new AbortController();
  private target: InteractionTarget | null = null;
  constructor(private element: HTMLButtonElement) {
    onPress(element, () => this.target?.onInteract(), { signal: this.abort.signal });
    this.setTarget(null);
  }
  destroy() { this.abort.abort(); this.setTarget(null); }
  setTarget(target: InteractionTarget | null) {
    this.target = target;
    this.element.hidden = !target;
    this.element.disabled = !target;
    this.element.dataset.icon = target?.icon ?? '';
    this.element.replaceChildren();
    if (target) {
      const icon = document.createElement('span'); icon.className = 'interaction-icon'; icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'interaction-label';
      label.textContent = target.verb ?? { talk: '对话', view: '查看', board: '上车' }[target.icon];
      this.element.append(icon, label);
    }
    this.element.setAttribute('aria-label', target?.label ?? '附近暂无可互动对象');
  }
}
