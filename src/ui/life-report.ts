import { getRoute } from '../content/routes';
import { keepRun, type RunRecord } from '../systems/run';
import { onPress } from './press';
export class LifeReport {
  private abort = new AbortController();
  private layer = document.createElement('div');
  constructor(private surface: HTMLElement, readonly record: RunRecord) {
    this.layer.id = 'life-report'; this.layer.dataset.inputBlocker = '';
    this.layer.setAttribute('role','dialog'); this.layer.setAttribute('aria-modal','true');
    this.layer.setAttribute('aria-label','余小迟的这一段人生');
    this.layer.innerHTML = '<article tabindex="-1"><header><small data-route></small><h2>余小迟的<br>这一段人生</h2><p data-month></p></header><section data-facts><h3>这一段时间，她做过……</h3><ul></ul></section><section data-choices><h3>一些选择</h3><ul></ul></section><section class="report-outcome"><h3>最后</h3><p></p></section><footer><p>这一段人生，就走到这里。</p><button type="button">收好</button></footer></article>';
    const snap = record.snapshot;
    this.layer.querySelector('[data-route]')!.textContent = getRoute(snap.routeId).trainName;
    this.layer.querySelector('[data-month]')!.textContent = snap.month ? `记录到 ${snap.month}` : '这一段时间，她……';
    for (const key of ['facts','choices'] as const) {
      const section = this.layer.querySelector<HTMLElement>(`[data-${key}]`)!;
      section.hidden = !snap.report[key].length;
      for (const entry of snap.report[key]) {
        const li = document.createElement('li'); const label = document.createElement('span'); label.textContent = entry.label; li.append(label);
        if (entry.value) { const value = document.createElement('strong'); value.textContent = entry.value; li.append(value); }
        section.querySelector('ul')!.append(li);
      }
    }
    this.layer.querySelector('.report-outcome p')!.textContent = snap.report.outcome;
    onPress(this.layer.querySelector('button')!, () => { this.record.collected = true; keepRun(this.record); this.collected(); }, { signal: this.abort.signal });
    surface.append(this.layer);
    // Keep gameplay mounted for inspection, but remove it from focus and interaction.
    for (const child of surface.children) if (child !== this.layer && child instanceof HTMLElement) child.inert = true;
    if(record.collected) this.collected(); else this.layer.querySelector<HTMLElement>('article')!.focus();
  }
  private collected() {
    this.layer.replaceChildren();
    const p = document.createElement('p'); p.className = 'report-recorded'; p.tabIndex = -1;
    p.setAttribute('role','status'); p.textContent = '这一段人生已记录。'; this.layer.append(p); p.focus();
  }
  destroy() { this.abort.abort(); this.layer.remove(); for(const child of this.surface.children) if(child instanceof HTMLElement) child.inert=false; }
}
