// Replacing a touched panel can retarget its synthetic click to the next panel.
// Suppress only that trailing click; new pointer gestures and keyboard input stay usable.
export function guardPanelTransition(root: HTMLElement, signal: AbortSignal) {
  let lastTouchUp = -Infinity;
  root.addEventListener('pointerup', e => { if (e.pointerType === 'touch') lastTouchUp = performance.now(); }, { capture: true, signal });
  return () => {
    if (performance.now() - lastTouchUp > 100) return;
    const remove = () => window.removeEventListener('click', block, true);
    const block = (e: MouseEvent) => { if (e.detail > 0) { e.preventDefault(); e.stopImmediatePropagation(); remove(); } };
    window.addEventListener('click', block, true); window.setTimeout(remove, 500);
    signal.addEventListener('abort', remove, { once: true });
  };
}
