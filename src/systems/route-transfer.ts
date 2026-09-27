import type { RouteId } from '../content/routes';
import { chapters } from '../content/chapters';
import { freshChapter, monthIndex, type ChapterState } from './events';
// One shared checkpoint with a tiny per-route cursor. Never reset facts, money or the calendar.
export function selectRoute(previous: ChapterState | null, route: RouteId): ChapterState {
  const content = chapters[route];
  const state = previous ?? freshChapter(route, content?.entry ?? '');
  const progress = state.routeProgress ??= {};
  if (previous) progress[state.currentRoute] = { eventId: state.eventId, chapterComplete: state.chapterComplete };
  state.initialRoute ??= route; state.currentRoute = route;
  const history = state.routeHistory ??= [state.initialRoute];
  if (history.at(-1) !== route) history.push(route);
  state.atStation = !content;
  state.eventId = progress[route]?.eventId ?? (content ? monthIndex(state.currentMonth) > monthIndex('2026年9月') ? content.lateEntry : content.entry : null);
  state.chapterComplete = progress[route]?.chapterComplete ?? false;
  if (progress[route]?.chapterComplete) state.eventId = null;
  state.resultSeed ??= Math.random();
  state.location = 'campus';
  return state;
}
export function returnToStation(state: ChapterState) {
  (state.routeProgress ??= {})[state.currentRoute] = { eventId: state.eventId, chapterComplete: state.chapterComplete };
  state.atStation = true;
}
