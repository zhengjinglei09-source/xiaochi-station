import { completeRun, keepRun, readRun, runId, RUN_KEY } from './systems/run';
import { LifeReport } from './ui/life-report';
import './styles.css';
import { Game } from './game/game';
import { LifeGame } from './life/life-game';
import { chapters, allEvents } from './content/chapters';
import { selectRoute, returnToStation } from './systems/route-transfer';
import type { RouteId } from './content/routes';
import { loadChapter, saveChapter, type ChapterState } from './systems/events';

const surface = document.querySelector<HTMLElement>('#game')!;
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const resetRequested = new URLSearchParams(window.location.search).has('reset');
if (resetRequested) {
  localStorage.removeItem('xiaochi.chapter.v1');
  sessionStorage.removeItem(RUN_KEY);
  window.history.replaceState({}, '', window.location.pathname);
}
let game: Game | LifeGame;
let report: LifeReport | null = null;
const reportRoutes = new Set<RouteId>(['employment']);
const start = () => game.start().catch(error => {
  console.error(error);
  const message = document.createElement('p');
  message.textContent = '角色素材加载失败，请刷新重试。';
  message.style.cssText = 'position:absolute;top:45%;left:10%;right:10%;padding:20px;background:#fff4df;text-align:center';
  surface.append(message);
});
let state: ChapterState | null = loadChapter(allEvents);
if (state && !state.runId) { state.runId = runId(); state.startedAt = null; saveChapter(state); }
function station() { game = new Game(surface, canvas, board, state ?? undefined); }
function life(showArrival = false) {
  const content = chapters[state!.currentRoute]!;
  game = new LifeGame(surface, canvas, state!, content.events, { ...content, showArrival, onComplete: reportRoutes.has(state!.currentRoute) ? () => {
    if (report) return;
    const record = { snapshot: completeRun(state!), collected: false };
    keepRun(record); report = new LifeReport(surface, record);
  } : undefined, onReturn: () => {
    returnToStation(state!); saveChapter(state!); game.destroy(); station(); void start();
  } });
}
function board(id: RouteId) {
  const fresh = !state;
  state = selectRoute(state, id);
  if (!state.runId) { state.runId = runId(); state.startedAt = fresh ? new Date().toISOString() : null; }
  const saved = saveChapter(state);
  if (!chapters[id]) {
    document.querySelector('#station-save-status')!.textContent = saved ? '' : '本机保存未成功，请保持页面打开。';
    return;
  }
  game.destroy(); life(true); void start();
}
if (state && !state.atStation && chapters[state.currentRoute]) life();
else station();
void start().then(() => { const record = readRun(state); if (record && reportRoutes.has(record.snapshot.routeId)) report = new LifeReport(surface, record); });
// Read-only inspection, only in development; no debug HUD in the game.
if (import.meta.env.DEV) Object.defineProperty(window, '__xiaochi', { value: { snapshot: () => ({ ...game.snapshot(), transfer: state ? structuredClone(state) : null }) }, configurable: true });
if (import.meta.hot) import.meta.hot.dispose(() => { report?.destroy(); game.destroy(); });
