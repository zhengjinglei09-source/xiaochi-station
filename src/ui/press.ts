// Secondary touch pointers do not consistently generate a browser click.
// Handle touch release directly, while retaining mouse and keyboard activation.
export function onPress(element: HTMLElement, action: () => void, options: { once?: boolean; signal?: AbortSignal } = {}) {
  let pointer: number | null = null;
  let ignoreClickUntil = 0;
  let used = false;
  const invoke = () => { if (options.once && used) return; used = true; action(); };
  const listenerOptions = { signal: options.signal };
  element.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && pointer === null) pointer = event.pointerId;
  }, listenerOptions);
  element.addEventListener('pointercancel', () => { pointer = null; }, listenerOptions);
  element.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    const box = element.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) return;
    ignoreClickUntil = Date.now() + 700;
    event.preventDefault();
    // Touch activation may replace/hide this button. Its synthetic click must
    // not activate a different button in the newly opened panel.
    const remove = () => { window.removeEventListener('click', trailingClick, true); window.removeEventListener('pointerdown', remove, true); };
    const trailingClick = (e: MouseEvent) => {
      if (e.detail > 0) { e.preventDefault(); e.stopImmediatePropagation(); remove(); }
    };
    window.addEventListener('click', trailingClick, true);
    window.addEventListener('pointerdown', remove, { capture: true, once: true });
    window.setTimeout(remove, 500);
    invoke();
  }, listenerOptions);
  element.addEventListener('click', event => {
    if (event.detail > 0 && Date.now() < ignoreClickUntil) return;
    invoke();
  }, listenerOptions);
}
