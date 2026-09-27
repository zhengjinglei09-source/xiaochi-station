import { guardPanelTransition } from './transition-click';
import { DocumentUpload, type UploadDefinition } from '../systems/documents';
import { onPress } from './press';
export class DocumentUploadPanel {
  private abort = new AbortController(); private session = new AbortController();
  private game: DocumentUpload | null = null; private selected: string | null = null;
  private pointer: { id: number; file: string; x: number; y: number; moved: boolean } | null = null;
  private callback: ((uploaded: string[] | null) => void) | null = null;
  private ghost: HTMLElement; private focus: HTMLElement | null = null; private ignoreClickUntil = 0; private page = 0;
  private guardTransition: () => void;
  constructor(private root: HTMLElement) {
    this.guardTransition = guardPanelTransition(root, this.abort.signal);
    this.ghost = root.querySelector('[data-file-ghost]')!;
    onPress(root.querySelector('[data-files-next]')!, () => { if (this.game) { this.page = (this.page + 1) % Math.ceil(this.game.data.files.length / 6); this.render(); } }, { signal: this.abort.signal });
    onPress(root.querySelector('[data-upload-close]')!, () => this.close(null), { signal: this.abort.signal });
    onPress(root.querySelector('[data-upload-submit]')!, () => { if (this.game?.ready) this.close([...this.game.uploaded]); }, { signal: this.abort.signal });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close(null);
      if (e.key === 'Tab') { const list = [...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b => !b.hidden); const i = list.indexOf(document.activeElement as HTMLButtonElement); e.preventDefault(); list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length]?.focus(); }
    }, { signal: this.abort.signal });
    window.addEventListener('blur', () => this.cancelDrag(), { signal: this.abort.signal });
    window.addEventListener('resize', () => this.cancelDrag(), { signal: this.abort.signal });
    document.addEventListener('visibilitychange', () => this.cancelDrag(), { signal: this.abort.signal });
  }
  open(data: UploadDefinition, callback: (uploaded: string[] | null) => void) {
    this.session.abort(); this.session = new AbortController(); this.focus = document.activeElement as HTMLElement;
    this.game = new DocumentUpload(data); this.page = 0; this.callback = callback; this.selected = null; this.root.hidden = false;
    this.root.querySelector('h2')!.textContent = data.title; this.root.querySelector('[data-folder]')!.textContent = data.folder;
    const files = this.root.querySelector('[data-files]')!, slots = this.root.querySelector('[data-slots]')!; files.replaceChildren(); slots.replaceChildren();
    for (const f of data.files) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.file = f.id; b.textContent = f.displayName; files.append(b);
      b.addEventListener('pointerdown', e => {
        if (this.pointer || e.button !== 0) return;
        e.preventDefault(); this.selected = f.id; this.render(); this.pointer = { id: e.pointerId, file: f.id, x: e.clientX, y: e.clientY, moved: false }; b.setPointerCapture(e.pointerId);
      }, { signal: this.session.signal });
      b.addEventListener('pointermove', e => {
        const p = this.pointer; if (!p || p.id !== e.pointerId) return; e.preventDefault();
        p.moved ||= Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6;
        if (p.moved) { this.ghost.hidden = false; this.ghost.textContent = f.displayName; this.ghost.style.left = `${e.clientX + 8}px`; this.ghost.style.top = `${e.clientY - 28}px`; }
      }, { signal: this.session.signal });
      b.addEventListener('pointerup', e => {
        const p = this.pointer; if (!p || p.id !== e.pointerId) return;
        e.preventDefault(); this.ignoreClickUntil = Date.now() + 600;
        const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]');
        if (p.moved && slot && this.root.contains(slot)) this.drop(p.file, slot.dataset.slot!);
        this.cancelDrag();
      }, { signal: this.session.signal });
      for (const type of ['pointercancel', 'lostpointercapture']) b.addEventListener(type, () => this.cancelDrag(), { signal: this.session.signal });
      b.addEventListener('click', e => { if (e.detail && Date.now() < this.ignoreClickUntil) return; this.selected = f.id; this.render(); }, { signal: this.session.signal });
    }
    for (const slot of data.slots) {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.slot = slot.id; slots.append(b);
      onPress(b, () => { if (this.selected && !this.pointer) this.drop(this.selected, slot.id); }, { signal: this.session.signal });
    }
    this.render(); this.root.querySelector('[data-upload-status]')!.textContent = '拖文件到右侧；也可以点文件，再点栏目。';
    this.root.querySelector<HTMLButtonElement>('[data-file]')!.focus({ preventScroll: true });
  }
  private drop(file: string, slot: string) {
    if (!this.game) return;
    const valid = this.game.drop(file, slot);
    this.root.querySelector('[data-upload-status]')!.textContent = valid ? this.game.uploaded.size === 5 ? 'All required documents uploaded.' : 'Uploaded.' : 'Invalid document　小迟：“……”';
    if (valid) this.selected = null; this.render();
  }
  private render() {
    const game = this.game!; this.root.querySelector('[data-upload-count]')!.textContent = `${game.uploaded.size} / ${game.data.slots.length}`;
    this.root.querySelectorAll<HTMLElement>('[data-file]').forEach((b,i) => { b.hidden = Math.floor(i / 6) !== this.page; b.setAttribute('aria-pressed', String(b.dataset.file === this.selected)); });
    const more = this.root.querySelector<HTMLButtonElement>('[data-files-next]')!; more.hidden = game.data.files.length <= 6; more.textContent = `文件 ${this.page+1}/${Math.ceil(game.data.files.length/6)} · 换页 →`;
    for (const slot of game.data.slots) { const b = this.root.querySelector<HTMLElement>(`[data-slot="${slot.id}"]`)!; b.textContent = `${game.uploaded.has(slot.id) ? '✓' : '□'} ${slot.label}`; b.dataset.done = String(game.uploaded.has(slot.id)); }
    const submit = this.root.querySelector<HTMLButtonElement>('[data-upload-submit]')!; submit.disabled = !game.ready; submit.textContent = game.uploaded.size === 5 ? 'CONTINUE TO APPLICATION' : '检查材料';
  }
  private cancelDrag() { const p = this.pointer; this.pointer = null; this.ghost.hidden = true; if (p) { const b = this.root.querySelector<HTMLElement>(`[data-file="${p.file}"]`); if (b?.hasPointerCapture(p.id)) b.releasePointerCapture(p.id); } }
  private close(value: string[] | null) { if (!this.callback) return; this.guardTransition(); this.cancelDrag(); const cb = this.callback; this.callback = null; this.game = null; this.session.abort(); this.root.hidden = true; this.focus?.focus({ preventScroll: true }); cb(value); }
  destroy() { this.cancelDrag(); this.abort.abort(); this.session.abort(); this.callback = null; this.root.hidden = true; }
}
