import type { FreeTime } from './free-action';
import { routes, type RouteId } from '../content/routes';
import type { UploadDefinition } from './documents';
import type { ActivityDefinition } from './activity';
import type { DialogueScript, Presentation } from './dialogue';
import type { QuizDefinition, QuizResult } from './quiz';
export type LocationId = 'campus' | 'dorm' | 'library';
export interface ChapterState {
  runId?: string; startedAt?: string | null;
  version: 1; initialRoute: RouteId; currentRoute: RouteId; currentChapter: number; currentMonth: string;
  location: LocationId; eventId: string | null; completed: string[]; chapterComplete: boolean;
  targetIndustry: string; targetRole: string; applicationCount: number; balance: number;
  interviewPrepChoice: string; jdFocus: string; friendReply: string; interviewChoices: string[];
  quizResult: QuizResult | null; playSeconds: number;
  atStation?: boolean; routeHistory?: RouteId[];
  routeProgress?: Partial<Record<RouteId, { eventId: string | null; chapterComplete: boolean }>>;
  postgradTarget?: string; postgradMemoryQuizResult?: boolean[]; postgradEnglishQuizResult?: QuizResult;
  postgradOctoberChoice?: 'continue' | 'stop'; postgradResult?: 'retest' | 'advance' | 'adjustment' | 'not_advance';
  civilServiceFirstJob?: string; civilServiceSecondJob?: string; civilServiceFinalJob?: string;
  civilServiceFirstFilters?: string[]; civilServiceSecondFilters?: string[];
  civilServiceQuizAnswers?: number[]; civilServiceQuizCompletedCount?: number;
  civilServiceEssayChoices?: { problems?: string[]; measures?: string[] }; civilServiceExamOrder?: string[];
  civilServiceFirstResult?: 'not_interview'; civilServiceSecondResult?: 'interview';
  civilServiceInterviewChoices?: string[]; civilServiceInterviewResult?: 'passed';
  abroadRegion?: string; abroadApplicationMethod?: string; abroadAgencyPackage?: string;
  abroadIELTSAttempts?: number; abroadIELTSScore?: number; abroadIELTSQuizResult?: QuizResult;
  abroadUploadedDocuments?: string[]; abroadRecommendationChoice?: string; abroadRecommendationReceived?: boolean;
  abroadAppliedSchools?: string[]; abroadApplicationResults?: Record<string, 'offer' | 'reject' | 'waitlist'>;
  abroadAcceptedSchool?: string;
  gapActions?: string[]; gapActionCounts?: Record<string, number>; gapFreeElapsed?: Record<string, number>;
  gapSelfDescription?: string; gapExperiment?: string; gapTravelStyle?: string; gapTravelItems?: string[];
  gapTravelStarted?: boolean;
  resultSeed?: number; eventReadyAt?: number;
}
export type Effect = { set?: Partial<Pick<ChapterState, 'targetIndustry' | 'targetRole' | 'applicationCount' | 'interviewPrepChoice' | 'jdFocus' | 'friendReply' | 'currentMonth' | 'chapterComplete' | 'location' | 'postgradTarget' | 'postgradOctoberChoice' | 'postgradResult' | 'civilServiceFirstResult' | 'civilServiceSecondResult' | 'civilServiceInterviewResult' | 'abroadIELTSAttempts' | 'abroadIELTSScore' | 'abroadRecommendationChoice' | 'abroadRecommendationReceived' | 'abroadApplicationResults' | 'gapSelfDescription' | 'gapExperiment' | 'gapTravelStyle' | 'gapTravelStarted'>>; money?: number; interviewAnswer?: string; memoryAnswer?: boolean; civilInterviewAnswer?: string; finalJobFromSelection?: boolean };
export interface StoryEvent {
  id: string; route: RouteId | 'shared'; chapter: number; month: string;
  location: LocationId | 'any'; trigger: 'auto' | 'object' | 'npc' | 'phone'; target: string;
  title: string; hint: string; dialogue: DialogueScript; choices?: Record<string, Effect>;
  effects?: Effect; nextEvent: string | null; optionalMiniGame?: QuizDefinition;
  quizState?: 'quizResult' | 'postgradEnglishQuizResult' | 'civilServiceQuizAnswers' | 'abroadIELTSQuizResult';
  resolve?: (state: ChapterState) => Partial<StoryEvent>;
  documents?: UploadDefinition;
  textValues?: Record<string, string>;
  activities?: Record<string, ActivityDefinition>; afterQuiz?: string;
  sequences?: Record<string, { steps: SequenceStep[]; next?: string }>;
  sequence?: SequenceStep[];
  freeExploreSeconds?: number; freeTime?: FreeTime;
  outcomes?: { dialogue: DialogueScript; effects: Effect }[];
}
export interface SequenceStep { title: string; text: string; seconds: number; presentation?: Presentation }
export const CHECKPOINT_KEY = 'xiaochi.chapter.v1';
export function freshChapter(route: RouteId, firstEvent: string): ChapterState {
  return { version: 1, initialRoute: route, currentRoute: route, currentChapter: 1, currentMonth: '2026年9月',
    location: 'campus', eventId: firstEvent, completed: [], chapterComplete: false, targetIndustry: '', targetRole: '',
    applicationCount: 0, balance: 8000, interviewPrepChoice: '', jdFocus: '', friendReply: '', interviewChoices: [], quizResult: null, playSeconds: 0 };
}
// One foreground event and one draft. Closing discards the draft, so re-opening never double-charges.
export class EventSystem {
  draft: ChapterState | null = null;
  private chosen = new Set<string>();
  private outcome: Effect | undefined;
  constructor(readonly events: readonly StoryEvent[], readonly state: ChapterState, private persist: (state: ChapterState) => void = () => {}) {
    const ids = new Set(events.map(e => e.id));
    if (ids.size !== events.length || events.some(e => e.nextEvent && !ids.has(e.nextEvent))) throw new Error('Invalid event links');
  }
  get current() { const e = this.events.find(e => e.id === this.state.eventId); return e ? { ...e, ...e.resolve?.(this.draft ?? this.state) } : null; }
  canTrigger(location: LocationId, target: string) {
    const e = this.current;
    return !!e && !this.draft && !this.state.completed.includes(e.id) && (e.route === 'shared' || e.route === this.state.currentRoute)
      && e.chapter === this.state.currentChapter && monthIndex(e.month) <= monthIndex(this.state.currentMonth) && this.state.playSeconds >= (this.state.eventReadyAt ?? 0) && (e.location === 'any' || e.location === location) && e.target === target;
  }
  begin(location: LocationId, target: string) {
    if (!this.canTrigger(location, target)) return null;
    this.chosen.clear();
    this.draft = structuredClone(this.state);
    const outcome = this.current!.outcomes?.[Math.floor((this.state.resultSeed ?? .5) * this.current!.outcomes!.length)];
    this.outcome = outcome?.effects;
    return this.script(undefined, outcome?.dialogue);
  }
  text(text: string) {
    const s = this.draft ?? this.state;
    const values: Record<string, string> = { targetIndustry: s.targetIndustry, targetRole: s.targetRole, ...this.current?.textValues,
      civilServiceFirstJob: s.civilServiceFirstJob ?? '', civilServiceSecondJob: s.civilServiceSecondJob ?? '', civilServiceFinalJob: s.civilServiceFinalJob ?? '',
      civilServiceExamOrder: s.civilServiceExamOrder?.join(' → ') ?? '', civilServiceEssayProblems: s.civilServiceEssayChoices?.problems?.join('、') ?? '', civilServiceEssayMeasures: s.civilServiceEssayChoices?.measures?.join('、') ?? '' };
    return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
  }
  script(start?: string, source?: DialogueScript) {
    const script = structuredClone(source ?? this.current!.dialogue);
    if (start) script.start = start;
    for (const node of Object.values(script.nodes)) { node.speaker = this.text(node.speaker); node.lines = node.lines.map(line => this.text(line)); }
    return script;
  }
  recordActivity(data: ActivityDefinition, values: string[]) {
    if (!this.draft) return;
    if (data.field === 'gapTravelStyle' || data.field === 'gapExperiment' || data.field === 'civilServiceFirstJob' || data.field === 'civilServiceSecondJob' || data.field === 'abroadRegion' || data.field === 'abroadApplicationMethod' || data.field === 'abroadAgencyPackage' || data.field === 'abroadAcceptedSchool') this.draft[data.field] = values[0];
    else if (data.field === 'civilServiceEssayChoices') (this.draft.civilServiceEssayChoices ??= {})[data.part!] = [...values];
    else this.draft[data.field] = [...values];
  }
  choose(id: string) {
    if (!this.draft || this.chosen.has(id)) return;
    this.chosen.add(id); this.apply(this.current?.choices?.[id]);
  }
  private apply(effect?: Effect) {
    if (!effect || !this.draft) return;
    if (effect.set) {
      const month = this.draft.currentMonth;
      Object.assign(this.draft, effect.set);
      if (monthIndex(this.draft.currentMonth) < monthIndex(month)) this.draft.currentMonth = month;
    }
    if (effect.money) this.draft.balance = Math.max(0, this.draft.balance + effect.money);
    if (effect.memoryAnswer !== undefined) (this.draft.postgradMemoryQuizResult ??= []).push(effect.memoryAnswer);
    if (effect.civilInterviewAnswer) (this.draft.civilServiceInterviewChoices ??= []).push(effect.civilInterviewAnswer);
    if (effect.finalJobFromSelection) this.draft.civilServiceFinalJob = this.draft.civilServiceSecondJob;
    if (effect.interviewAnswer) this.draft.interviewChoices.push(effect.interviewAnswer);
  }
  cancel() { this.draft = null; }
  pause() {
    if (!this.draft) return;
    this.draft.playSeconds = this.state.playSeconds;
    Object.assign(this.state, this.draft); this.draft = null; this.persist(this.state);
  }
  finish(quizResult?: QuizResult) {
    const event = this.current;
    if (!event || !this.draft || this.state.completed.includes(event.id)) return false;
    this.apply(event.effects); this.apply(this.outcome);
    if (quizResult) {
      if (event.quizState === 'civilServiceQuizAnswers') { this.draft.civilServiceQuizAnswers = [...quizResult.answers]; this.draft.civilServiceQuizCompletedCount = quizResult.answers.length; }
      else this.draft[event.quizState ?? 'quizResult'] = quizResult;
    }
    if (event.freeExploreSeconds) this.draft.eventReadyAt = this.state.playSeconds + event.freeExploreSeconds;
    this.draft.completed.push(event.id); this.draft.eventId = event.nextEvent;
    this.draft.playSeconds = this.state.playSeconds;
    Object.assign(this.state, this.draft); this.draft = null;
    this.persist(this.state); return true;
  }
}
export function monthIndex(month: string) { const [year, value] = month.match(/\d+/g)!.map(Number); return year * 12 + value; }
export function saveChapter(state: ChapterState) {
  try { localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
export function loadChapter(events: readonly StoryEvent[]): ChapterState | null {
  try {
    const s = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) ?? 'null');
    if (!s || s.version !== 1 || !routes.some(r => r.id === s.currentRoute) || !routes.some(r => r.id === s.initialRoute) || s.currentChapter !== 1
      || !['campus', 'dorm', 'library'].includes(s.location) || !/^202[67]年(1[0-2]|[1-9])月$/.test(s.currentMonth)
      || !Array.isArray(s.completed) || new Set(s.completed).size !== s.completed.length || s.completed.includes(s.eventId) || s.completed.some((id: string) => !events.some(e => e.id === id))
      || !(s.atStation === true || s.eventId === null && s.chapterComplete === true || events.some(e => e.id === s.eventId && e.route === s.currentRoute))
      || !['balance', 'applicationCount', 'playSeconds'].every(k => Number.isFinite(s[k]) && s[k] >= 0)
      || !['targetIndustry', 'targetRole', 'interviewPrepChoice', 'jdFocus', 'friendReply'].every(k => typeof s[k] === 'string')
      || !Array.isArray(s.interviewChoices) || s.interviewChoices.some((v: unknown) => typeof v !== 'string')) return null;
    return s;
  } catch { return null; }
}
