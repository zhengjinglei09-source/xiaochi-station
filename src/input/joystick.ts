import { CONFIG, type Vec2 } from '../game/config';

export class DynamicJoystick {
  readonly value: Vec2 = { x: 0, y: 0 };
  private pointerId: number | null = null;
  private origin: Vec2 = { x: 0, y: 0 };
  private abort = new AbortController();
  private enabled = true;
  constructor(private surface: HTMLElement, private visual: HTMLElement, private knob: HTMLElement, private onStop: () => void) {
    const options = { signal: this.abort.signal };
    surface.addEventListener('pointerdown', this.down, options);
    surface.addEventListener('pointermove', this.move, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(type, this.end as EventListener, options);
    surface.addEventListener('contextmenu', event => event.preventDefault(), options);
    window.addEventListener('blur', this.reset, options);
    window.addEventListener('pagehide', this.reset, options);
    window.addEventListener('resize', this.reset, options);
    document.addEventListener('visibilitychange', this.reset, options);
  }
  private down = (event: PointerEvent) => {
    if (!this.enabled || this.pointerId !== null || event.button !== 0 || (event.target as Element).closest('button, [data-input-blocker]')) return;
    const rect = this.surface.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    const header = this.surface.querySelector('.masthead')!.getBoundingClientRect();
    const footer = this.surface.querySelector('.caption')!.getBoundingClientRect();
    // Exclude unsafe top/bottom insets. Header itself has no interactive controls.
    if (x < 8 || x > rect.width * CONFIG.triggerWidth || y < header.bottom - rect.top + 8 || event.clientY > footer.bottom) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.origin = { x: event.clientX, y: event.clientY };
    this.surface.setPointerCapture(event.pointerId);
    this.visual.style.left = `${x}px`; this.visual.style.top = `${y}px`;
    this.visual.dataset.active = 'true';
    this.surface.dataset.steering = 'true';
    this.knob.style.transform = 'translate(0px, 0px)';
  };
  private move = (event: PointerEvent) => {
    if (!this.enabled || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const x = event.clientX - this.origin.x; const y = event.clientY - this.origin.y;
    const distance = Math.hypot(x, y);
    const clamped = Math.min(distance, CONFIG.joystickRadius);
    const nx = distance ? x / distance : 0; const ny = distance ? y / distance : 0;
    this.knob.style.transform = `translate(${nx * clamped * .65}px, ${ny * clamped * .65}px)`;
    const force = Math.max(0, (clamped - CONFIG.joystickDeadZone) / (CONFIG.joystickRadius - CONFIG.joystickDeadZone));
    this.value.x = nx * force; this.value.y = ny * force;
    if (!force) this.onStop();
  };
  private end = (event: PointerEvent) => { if (event.pointerId === this.pointerId) this.reset(); };
  reset = () => {
    const id = this.pointerId;
    this.pointerId = null;
    this.value.x = 0; this.value.y = 0;
    this.visual.dataset.active = 'false';
    this.surface.dataset.steering = 'false';
    this.onStop();
    if (id !== null && this.surface.hasPointerCapture(id)) this.surface.releasePointerCapture(id);
  };
  destroy() { this.reset(); this.abort.abort(); }
  setEnabled(enabled: boolean) { this.enabled = enabled; if (!enabled) this.reset(); }
}
