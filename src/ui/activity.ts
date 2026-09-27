import { guardPanelTransition } from './transition-click';
import { ActivitySelection, type ActivityDefinition } from '../systems/activity';
import { onPress } from './press';
export class ActivityPanel {
  private abort = new AbortController();
  private selection: ActivitySelection | null = null;
  private callback: ((values: string[] | null) => void) | null = null;
  private previousFocus: HTMLElement | null = null;
  private guardTransition: () => void;
  constructor(private root: HTMLElement) {
    this.guardTransition = guardPanelTransition(root, this.abort.signal);
    onPress(root.querySelector('[data-activity-close]')!, () => this.close(null), { signal: this.abort.signal });
    onPress(root.querySelector('[data-activity-submit]')!, () => { if (this.selection?.valid) this.close(this.selection.values); }, { signal: this.abort.signal });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); this.close(null); }
      if (e.key === 'Tab') {
        const buttons = [...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b => !b.hidden);
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement); e.preventDefault();
        buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }
    }, { signal: this.abort.signal });
  }
  open(data: ActivityDefinition, callback: (values: string[] | null) => void) {
    this.previousFocus = document.activeElement as HTMLElement; this.callback = callback;
    this.selection = new ActivitySelection(data); this.root.hidden = false; this.root.dataset.kind = data.kind;
    this.root.querySelector('h2')!.textContent = data.title;
    this.root.querySelector('[data-activity-intro]')!.textContent = data.intro ?? '';
    const materials = this.root.querySelector('[data-activity-materials]')!; materials.replaceChildren();
    (data.materials ?? []).forEach((text, i) => { const p = document.createElement('p'); p.textContent = `材料${i + 1}　${text}`; materials.append(p); });
    const options = this.root.querySelector('[data-activity-options]')!; options.replaceChildren();
    data.options.forEach(option => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.card = option.id;
      const label = document.createElement('strong'); label.textContent = option.label; b.append(label);
      if (option.detail) { const small = document.createElement('small'); small.textContent = option.detail; b.append(small); }
      const mark = document.createElement('span'); mark.className = 'card-mark'; b.append(mark); options.append(b);
      onPress(b, () => { this.selection!.toggle(option.id); this.render(); });
    });
    this.render(); this.root.querySelector<HTMLElement>('.activity-scroll')!.scrollTop = 0;
    this.root.querySelector<HTMLButtonElement>('[data-card]')!.focus({ preventScroll: true });
  }
  private render() {
    const s = this.selection!, d = s.data;
    this.root.querySelector('[data-activity-status]')!.textContent = d.kind === 'filters' ? `符合条件：${s.count}` : d.kind === 'order' ? s.values.join(' → ') || '按你想做的顺序点选' : `已选 ${s.selected.length} / ${d.max ?? d.options.length}`;
    this.root.querySelectorAll<HTMLButtonElement>('[data-card]').forEach(b => {
      const i = s.selected.indexOf(b.dataset.card!); b.setAttribute('aria-pressed', String(i >= 0));
      b.querySelector('.card-mark')!.textContent = i < 0 ? '' : d.kind === 'order' ? String(i + 1) : '✓';
    });
    const submit = this.root.querySelector<HTMLButtonElement>('[data-activity-submit]')!;
    submit.disabled = !s.valid; submit.textContent = d.submit ?? '提交';
  }
  private close(values: string[] | null) {
    if (!this.callback) return;
    this.guardTransition();
    const callback = this.callback; this.callback = null; this.selection = null; this.root.hidden = true;
    this.previousFocus?.focus({ preventScroll: true }); this.previousFocus = null; callback(values);
  }
  destroy() { this.abort.abort(); this.root.hidden = true; this.callback = null; }
}
