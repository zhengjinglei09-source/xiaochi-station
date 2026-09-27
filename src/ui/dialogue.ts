import type { DialogueView } from '../systems/dialogue';
import { onPress } from './press';
import { routes } from '../content/routes';

export class DialoguePanel {
  private previousFocus: HTMLElement | null = null;
  private abort = new AbortController();
  private speaker: HTMLElement;
  private text: HTMLElement;
  private actions: HTMLElement;
  private routeStatus: HTMLElement;
  constructor(private element: HTMLElement, private onContinue: () => void, private onChoose: (id: string) => void, onClose: () => void) {
    this.speaker = element.querySelector('[data-speaker]')!;
    this.text = element.querySelector('[data-dialogue-text]')!;
    this.actions = element.querySelector('[data-dialogue-actions]')!;
    this.routeStatus = element.querySelector('[data-route-status]')!;
    onPress(element.querySelector<HTMLElement>('[data-dialogue-close]')!, onClose, { signal: this.abort.signal });
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(element.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    }, { signal: this.abort.signal });
  }
  render(view: DialogueView | null) {
    if (!view) {
      this.element.hidden = true;
      this.previousFocus?.focus({ preventScroll: true }); this.previousFocus = null;
      return;
    }
    if (this.element.hidden) this.previousFocus = document.activeElement as HTMLElement;
    this.element.hidden = false;
    this.speaker.textContent = view.speaker;
    this.text.textContent = view.text;
    this.element.querySelector<HTMLElement>('.dialogue-panel')!.dataset.feedback = view.tone ?? '';
    // Presentation only: reuse the existing dialogue progression and callbacks.
    const route = routes.find(route => route.trainName === view.speaker);
    this.element.dataset.routeInfo = String(!!route);
    this.routeStatus.hidden = !route;
    this.routeStatus.textContent = route?.platformStatus ?? '';
    this.actions.replaceChildren();
    if (view.choices.length) {
      for (const choice of view.choices) {
        const button = this.button(choice.text);
        button.dataset.choice = choice.id;
        onPress(button, () => this.onChoose(choice.id), { once: true });
      }
    } else {
      const button = this.button(view.last ? '收起' : '继续 ▸');
      button.dataset.continue = '';
      onPress(button, this.onContinue, { once: true });
    }
    (this.actions.firstElementChild as HTMLElement)?.focus({ preventScroll: true });
    // A scrolled choice list must not hide the next node's speaker or close button.
    this.element.querySelector<HTMLElement>('.dialogue-panel')!.scrollTop = 0;
  }
  private button(text: string) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
    this.actions.append(button); return button;
  }
  destroy() { this.abort.abort(); }
}
