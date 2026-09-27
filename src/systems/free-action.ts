import type { DialogueScript } from './dialogue';
import type { LocationId, SequenceStep } from './events';
import type { LifeObject } from '../life/life-map';
export interface FreeAction {
  id: string; location: LocationId; target: LifeObject; recordKey: string; timeCost?: number;
  dialogue: DialogueScript; sequences?: Record<string, { steps: SequenceStep[]; next?: string }>;
}
export interface FreeTime { seconds: number; actions: readonly FreeAction[]; clock?: boolean }
// A foreground-time clock with neutral records. No reward, score, or required action.
export function recordAction(state: { gapActions?: string[]; gapActionCounts?: Record<string, number> }, key: string) {
  (state.gapActions ??= []).push(key);
  const counts = state.gapActionCounts ??= {}; counts[key] = (counts[key] ?? 0) + 1;
}
export function clockText(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
export function dayClock(elapsed: number, duration: number, minimumMinutes = 0) {
  return clockText(Math.max(minimumMinutes, elapsed < duration / 3 ? 680 : elapsed < duration * 2 / 3 ? 926 : 1188));
}
