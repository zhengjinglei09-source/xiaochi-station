import type { Onboarding } from '../systems/onboarding';

export class OnboardingHints {
  private movement = document.querySelector<HTMLElement>('#movement-hint')!;
  private message = document.querySelector<HTMLElement>('#onboarding-hint')!;
  private context = document.querySelector<HTMLElement>('#onboarding-context')!;
  private direction = document.querySelector<HTMLElement>('#platform-direction')!;
  private key = '';
  render(state: Onboarding, exploring: boolean) {
    const platform = exploring && state.platformVisible;
    const context = exploring ? state.contextHint : null;
    const key = `${exploring}:${platform}:${context}:${state.emphasis}`;
    if (key === this.key) return;
    this.key = key;
    this.movement.dataset.emphasis = state.emphasis;
    this.direction.dataset.visible = String(platform);
    this.direction.setAttribute('aria-hidden', String(!platform));
    this.movement.setAttribute('aria-hidden', String(!exploring));
    this.message.dataset.visible = String(platform);
    this.message.setAttribute('aria-hidden', String(!platform));
    this.context.dataset.visible = String(!!context);
    this.context.setAttribute('aria-hidden', String(!context));
    if (context) this.context.textContent = context === 'info' ? '看看站讯' : '和列车员聊聊';
  }
  drawPlatformMarker(c: CanvasRenderingContext2D, x: number, y: number, time: number, reducedMotion: boolean) {
    c.save(); c.globalAlpha = reducedMotion ? .65 : .48 + Math.sin(time * 2.4) * .15;
    c.fillStyle = '#fff4c2';
    for (const side of [-1, 1]) {
      c.fillRect(x + (side < 0 ? -17 : 11), y - 33, 7, 2);
      c.fillRect(x + (side < 0 ? -17 : 16), y - 33, 2, 6);
    }
    c.restore();
  }
}
