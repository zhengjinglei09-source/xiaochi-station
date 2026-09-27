import type { ChapterState } from './events';
import type { RouteId } from '../content/routes';
import { buildReport, type ReportContent } from '../content/reports';
export const RUN_KEY = 'xiaochi.run.v1';
export interface RunSnapshot {
  version: 1; runId: string; routeId: RouteId; initialRoute: RouteId;
  startedAt: string | null; completedAt: string; month: string; status: 'completed';
  routeData: ChapterState; report: ReportContent;
}
export interface RunRecord { snapshot: RunSnapshot; collected: boolean }
export const runId = () => `run-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(2)), x => x.toString(36)).join('')}`;
export function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function completeRun(state: ChapterState): RunSnapshot {
  if (!state.chapterComplete || state.atStation) throw new Error('Run is still in progress');
  const data = structuredClone(state);
  return freeze({ version: 1, runId: data.runId ?? runId(), routeId: data.currentRoute, initialRoute: data.initialRoute,
    startedAt: data.startedAt ?? null, completedAt: new Date().toISOString(), month: data.currentMonth,
    status: 'completed', routeData: data, report: buildReport(data) });
}
export function keepRun(record: RunRecord) {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify(record)); } catch { /* The component retains this session's immutable record in memory. */ }
}
export function readRun(state: ChapterState | null): RunRecord | null {
  try {
    const record = JSON.parse(sessionStorage.getItem(RUN_KEY) ?? 'null') as RunRecord | null;
    if (!state?.chapterComplete || state.atStation || !state.runId || !record || record.snapshot.version !== 1 || record.snapshot.runId !== state.runId || record.snapshot.routeId !== state.currentRoute || !Array.isArray(record.snapshot.report.facts) || !Array.isArray(record.snapshot.report.choices)) return null;
    return { snapshot: freeze(record.snapshot), collected: record.collected === true };
  } catch { return null; }
}
