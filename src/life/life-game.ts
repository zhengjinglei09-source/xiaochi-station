import { clockText, dayClock, recordAction, type FreeAction } from '../systems/free-action';
import { travelActions } from '../content/gap-actions';
import { travelMap, drawTravel } from './travel';
import { Player } from '../game/player';
import { CharacterRenderer } from '../assets/character';
import { NpcRenderer } from '../assets/npc';
import { DynamicJoystick } from '../input/joystick';
import { InteractionSystem } from '../systems/interaction';
import { DialogueSystem, type DialogueScript, type Presentation } from '../systems/dialogue';
import { DialoguePanel } from '../ui/dialogue';
import { InteractionButton } from '../ui/interaction';
import { onPress } from '../ui/press';
import { EventSystem, saveChapter, type ChapterState, type LocationId, type StoryEvent, type SequenceStep } from '../systems/events';
import { DocumentUploadPanel } from '../ui/documents';
import { ActivityPanel } from '../ui/activity';
import { Vignette } from './vignette';
import { QuizMiniGame } from '../systems/quiz';
import { getRoute } from '../content/routes';
import { lifeMaps, drawLifeMap, type LifeObject } from './life-map';

export class LifeGame {
  private player = new Player();
  private freeAction: FreeAction | null = null; private freeSaveTime = 0; private freeClockAfter: number | null = null;
  private get traveling() { return this.state.currentRoute === 'gap' && this.state.gapTravelStarted === true; }
  private get map() { return this.traveling ? travelMap : lifeMaps[this.state.location]; }
  private get freeActions() { return this.events.current?.freeTime?.actions ?? (this.traveling ? travelActions : []); }
  private get objects() {
    const actions = this.freeActions.filter(a => a.location === this.state.location);
    return [...this.map.objects.filter(o => !actions.some(a => a.target.id === o.id)), ...actions.map(a => a.target)];
  }
  private script(start?: string) {
    if (!this.freeAction) return this.events.script(start);
    const script = structuredClone(this.freeAction.dialogue); if (start) script.start = start; return script;
  }
  private hero = new CharacterRenderer();
  private npcs = new NpcRenderer();
  private joystick: DynamicJoystick;
  private interactions = new InteractionSystem([]);
  private button: InteractionButton;
  private dialogue: DialogueSystem;
  private panel: DialoguePanel;
  private events: EventSystem;
  private quiz: QuizMiniGame | null = null;
  private autoOpenedId: string | null = null;
  private quizActive = false; private activity: ActivityPanel; private documents: DocumentUploadPanel;
  private presentation: Presentation | undefined; private vignette = new Vignette();
  private sequence: SequenceStep[] = []; private afterSequence: string | undefined;
  private mode: 'exploring' | 'dialogue' | 'activity' | 'transition' | 'complete' = 'transition';
  private frame = 0; private previous = 0; private height = 640; private originY = 185;
  private abort = new AbortController(); private observer: ResizeObserver; private timer = 0;
  private ctx: CanvasRenderingContext2D; private terrain = document.createElement('canvas');
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastTarget: string | null = null;
  private saved = true;
  private sequenceStep = -1; private sequenceTime = 0;
  private mapLocation: LocationId = 'campus';
  private mail = document.querySelector<HTMLButtonElement>('#life-mail')!;
  constructor(private surface: HTMLElement, private canvas: HTMLCanvasElement, readonly state: ChapterState, content: readonly StoryEvent[], private options: { arrival?: string; ending?: string; endingSubtitle?: string; campusSubtitle?: string; endingJob?: boolean; quietEnding?: boolean; endingDetail?: (state: ChapterState) => string; showArrival?: boolean; onComplete?: () => void; onReturn?: () => void } = {}) {
    this.ctx = canvas.getContext('2d')!;
    surface.dataset.quietEnding = 'false'; surface.dataset.scene = 'life'; surface.dataset.mode = this.mode;
    surface.setAttribute('aria-label', '小迟去哪儿，大四生活地图');
    canvas.setAttribute('aria-label', '大四生活地图。左侧拖动移动，靠近物体后可交互。');
    document.querySelector<HTMLElement>('#phase-complete')!.hidden = true;
    document.querySelector<HTMLElement>('#life-hud')!.hidden = false;
    document.querySelector<HTMLElement>('.caption span')!.textContent = '大四的第一站';
    this.joystick = new DynamicJoystick(surface, document.querySelector('#joystick')!, document.querySelector('#joystick-knob')!, () => this.player.stop());
    this.joystick.setEnabled(false);
    this.button = new InteractionButton(document.querySelector('#interaction')!);
    this.panel = new DialoguePanel(document.querySelector('#dialogue-layer')!, () => this.dialogue.continue(), id => this.dialogue.choose(id), () => this.dialogue.close());
    this.activity = new ActivityPanel(document.querySelector('#activity-layer')!);
    this.documents = new DocumentUploadPanel(document.querySelector('#upload-layer')!);
    this.dialogue = new DialogueSystem(view => { this.presentation = view?.presentation; this.panel.render(view); }, id => { if (this.quizActive) this.quiz!.choose(id); else this.events.choose(id); });
    this.events = new EventSystem(content, state, s => { this.saved = saveChapter(s); this.updateHud(); });
    onPress(this.mail, () => this.openEvent('phone'), { signal: this.abort.signal });
    onPress(document.querySelector('#chapter-save-retry')!, () => { this.saved = saveChapter(this.state); this.showEnd(); }, { signal: this.abort.signal });
    const reportButton = document.querySelector<HTMLButtonElement>('#chapter-report')!;
    reportButton.hidden = !this.options.onComplete;
    onPress(reportButton, () => { if (this.mode === 'complete') this.options.onComplete?.(); }, {signal: this.abort.signal});
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(surface);
    this.enter(state.location);
  }
  async start() {
    await Promise.all([this.hero.load(), this.npcs.load()]);
    this.canvas.dataset.ready = 'true';
    this.frame = requestAnimationFrame(this.tick);
    if (this.state.chapterComplete) { this.setMode('complete'); this.showEnd(); return; }
    if (this.events.current?.trigger === 'auto' || this.options.showArrival) {
      document.querySelector('#life-transition strong')!.textContent = this.state.currentMonth;
      document.querySelector('#life-transition p')!.textContent = this.options.arrival ?? '秋招开始了。';
      document.querySelector<HTMLElement>('#life-transition')!.hidden = false;
      this.timer = window.setTimeout(() => {
        document.querySelector<HTMLElement>('#life-transition')!.hidden = true;
        this.setMode('exploring'); if (this.events.current?.trigger === 'auto' && !this.events.current.freeTime) this.openEvent(this.events.current.target);
      }, this.reducedMotion ? 300 : 1400);
    } else this.setMode('exploring');
    this.updateHud();
  }
  private resize() {
    this.joystick.reset();
    this.height = Math.round(this.surface.clientHeight / this.surface.clientWidth * 360);
    this.originY = Math.max(185, Math.min(220, this.height * .26));
    this.canvas.width = 360; this.canvas.height = this.height; this.ctx.imageSmoothingEnabled = false;
    this.terrain.width = 360; this.terrain.height = 390;
    if (this.traveling) drawTravel(this.terrain.getContext('2d')!, this.state.gapTravelStyle ?? 'seaside');
    else drawLifeMap(this.terrain.getContext('2d')!, this.state.location, this.events.current?.id === 'result' || this.state.chapterComplete);
  }
  private enter(location: LocationId, from?: LocationId) {
    this.state.location = location; this.mapLocation = location;
    const map = this.map; this.player.setMap(map);
    Object.assign(this.player, location === 'campus' && from ? { x: from === 'dorm' ? 65 : 290, y: 166 } : map.spawn);
    this.interactions = new InteractionSystem(this.objects.map(object => ({
      id: object.id, type: object.kind === 'friend' ? 'npc' : 'sign', target: { id: object.id, position: object }, range: 32,
      prompt: object.name, icon: object.kind === 'friend' ? 'talk' : 'view', action: () => this.interact(object),
    })));
    this.lastTarget = null; this.button.setTarget(null);
    document.querySelector('h1')!.textContent = map.name;
    document.querySelector('.location div>span')!.textContent = !this.traveling && location === 'campus' ? this.options.campusSubtitle ?? map.subtitle : map.subtitle;
    document.querySelector('.platform')!.textContent = this.state.currentMonth.slice(5);
    if(this.state.currentRoute==='gap') document.querySelector<HTMLElement>('.caption span')!.textContent = this.traveling ? '旅行中' : '大四的日常';
    this.resize(); this.updateHud();
  }
  private interact(object: LifeObject) {
    if (this.mode !== 'exploring') return;
    if (object.to) { if (this.events.current?.freeTime && this.state.currentRoute === 'gap') { recordAction(this.state, 'walk'); this.saved = saveChapter(this.state); } this.joystick.reset(); this.enter(object.to, this.state.location); return; }
    const free = this.freeActions.find(a => a.location === this.state.location && a.target.id === object.id);
    if (free) {
      this.freeAction = structuredClone(free); this.freeClockAfter = null;
      const event = this.events.current!;
      if (free.timeCost && event.freeTime?.clock) {
        const clock = dayClock(this.state.gapFreeElapsed?.[event.id] ?? 0, event.freeTime.seconds, this.state.gapFreeElapsed?.[event.id+':clock']);
        const [hours, minutes] = clock.split(':').map(Number);
        this.freeClockAfter = Math.min(1439, hours * 60 + minutes + free.timeCost);
        const steps = this.freeAction.sequences?.action.steps;
        if (steps) { steps[0].title = clock; steps[steps.length-1].title = clockText(this.freeClockAfter); }
      }
      this.setMode('dialogue'); this.showScript(this.script()); return;
    }
    if (this.events.canTrigger(this.state.location, object.id)) { this.openEvent(object.id); return; }
    const lines: Record<string, string> = { bed: '床单晒过了。坐一会儿，什么也不做也可以。', computer: '电脑安静地亮着，书签还留在上次的位置。', phone: '暂时没有新的消息。', reading: '靠窗的桌子，放得下一本书、一杯水和今天的计划。', friend: '“一会儿食堂见。我先把这几页看完。”' };
    this.setMode('dialogue');
    this.dialogue.open({ id: 'daily', start: 'start', nodes: { start: { speaker: object.kind === 'friend' ? '朋友' : '余小迟', lines: [lines[object.kind] ?? '去校园走走。'] } } }, () => this.setMode('exploring'));
  }
  private openEvent(target: string) {
    if (this.mode !== 'exploring') return;
    const script = this.events.begin(this.state.location, target); if (!script) return;
    if (this.events.current?.trigger === 'auto') this.autoOpenedId = this.events.current.id;
    this.setMode('dialogue'); this.showScript(script);
  }
  private showScript(script: DialogueScript) {
    this.dialogue.open(script, action => {
      if (action === 'timer-expired') return;
      if (action === 'quiz' && this.events.current?.optionalMiniGame) {
        this.quiz = new QuizMiniGame(this.events.current.optionalMiniGame); this.quizActive = true;
        this.showScript(this.quiz.script()); return;
      }
      if (action === 'quiz-submit') { this.endTimedQuiz(); return; }
      if (action === 'quiz-done' && this.events.current?.afterQuiz) {
        this.quizActive = false; this.showScript(this.events.script(this.events.current.afterQuiz)); return;
      }
      if (action === 'documents' && this.events.current?.documents) {
        const data = this.events.current.documents;
        this.setMode('activity'); this.documents.open(data, uploaded => {
          if (!uploaded) { this.finishEvent(); return; }
          if (this.events.draft) this.events.draft.abroadUploadedDocuments = uploaded;
          this.setMode('dialogue'); this.showScript(this.script(data.next));
        }); return;
      }
      if (action?.startsWith('activity:')) {
        const data = this.events.current?.activities?.[action.slice(9)];
        if (data) { this.setMode('activity'); this.activity.open(data, values => {
          if (!values) { this.finishEvent(); return; }
          this.events.recordActivity(data, values); this.setMode('dialogue'); this.showScript(this.script(this.events.current?.activities?.[action.slice(9)]?.next ?? data.next));
        }); return; }
      }
      if (action === 'return-station') {
        this.events.pause(); this.setMode('transition');
        const overlay = document.querySelector<HTMLElement>('#life-transition')!;
        overlay.querySelector('strong')!.textContent = '人生车站'; overlay.querySelector('p')!.textContent = '书收好了。去看看下一趟车。'; overlay.hidden = false;
        this.timer = window.setTimeout(() => this.options.onReturn?.(), 700); return;
      }
      const sequence = action === 'sequence' ? { steps: this.events.current?.sequence } : action?.startsWith('sequence:') ? (this.freeAction?.sequences ?? this.events.current?.sequences)?.[action.slice(9)] : null;
      if (sequence?.steps) {
        this.sequence = sequence.steps; this.afterSequence = 'next' in sequence ? sequence.next : undefined;
        this.sequenceStep = 0; this.sequenceTime = 0; this.setMode('transition'); this.showSequence(); return;
      }
      this.finishEvent(action);
    });
  }
  private endTimedQuiz() {
    if (!this.quizActive || !this.quiz) return;
    this.quizActive = false;
    if (this.dialogue.active) this.dialogue.close('timer-expired');
    this.showScript(this.quiz.summaryScript());
  }
  private showSequence() {
    const step = this.sequence[this.sequenceStep];
    this.presentation = step.presentation;
    const overlay = document.querySelector<HTMLElement>('#life-transition')!;
    overlay.dataset.presentation = step.presentation ?? '';
    overlay.querySelector('strong')!.textContent = this.events.text(step.title); overlay.querySelector('p')!.textContent = this.events.text(step.text); overlay.hidden = false;
  }
  private finishEvent(action?: string) {
    if (this.freeAction) {
      if (action === 'complete') {
        recordAction(this.state, this.freeAction.recordKey);
        if (this.freeClockAfter !== null) (this.state.gapFreeElapsed ??= {})[this.events.current!.id+':clock'] = this.freeClockAfter;
        this.saved = saveChapter(this.state);
      }
      this.freeAction = null; this.presentation = undefined; this.setMode('exploring'); return;
    }
    const oldPosition = { x: this.player.x, y: this.player.y }, oldLocation = this.state.location, wasTraveling = this.traveling;
    if (action === 'complete' || action === 'quiz-done' || (this.events.current?.trigger === 'auto' && !this.events.current.activities && !this.events.current.sequences)) this.events.finish(this.quiz?.result);
    else {
      this.events.cancel();
      if (this.state.currentRoute === 'gap' && this.events.current?.trigger === 'auto' && !this.events.current.freeTime) {
        this.autoOpenedId = null; this.state.eventReadyAt = this.state.playSeconds + .5;
      }
    }
    this.quiz = null; this.quizActive = false; this.presentation = undefined;
    document.querySelector<HTMLElement>('#quiz-clock')!.hidden = true;
    if (this.state.location !== this.mapLocation || this.state.currentRoute === 'gap') this.enter(this.state.location);
    else this.resize();
    if(this.state.currentRoute==='gap' && oldLocation===this.state.location && wasTraveling===this.traveling) Object.assign(this.player,oldPosition);
    this.updateHud();
    if (this.state.chapterComplete) { this.setMode('complete'); this.showEnd(); }
    else this.setMode('exploring');
  }

  private setMode(mode: typeof this.mode) {
    this.mode = mode; this.surface.dataset.mode = mode;
    this.joystick.setEnabled(mode === 'exploring'); this.player.stop();
    this.lastTarget = null; this.button.setTarget(null); this.updateHud();
  }
  private updateHud() {
    const event = this.events.current;
    const hint = this.events.current?.freeTime?.clock ? dayClock(this.state.gapFreeElapsed?.[this.events.current.id] ?? 0, this.events.current.freeTime.seconds, this.state.gapFreeElapsed?.[this.events.current.id+':clock']) : this.state.playSeconds < (this.state.eventReadyAt ?? 0) ? '' : event?.hint ?? this.options.ending ?? '秋招还在继续。';
    const hintElement = document.querySelector('#life-hint')!;
    if (hintElement.textContent !== hint) hintElement.textContent = hint;
    document.querySelector('.platform')!.textContent = this.state.currentMonth.slice(5);
    document.querySelector('#life-date')!.textContent = `${this.state.currentMonth} · ${getRoute(this.state.currentRoute).trainName}`;
    document.querySelector<HTMLElement>('#checkpoint-warning')!.hidden = this.saved;
    const mailText = this.state.currentRoute === 'gap' ? '▤ 一条消息' : '▤ 叮——新邮件';
    if (this.mail.textContent !== mailText) this.mail.textContent = mailText;
    this.mail.hidden = this.mode !== 'exploring' || !this.events.canTrigger(this.state.location, 'phone');
  }
  private showEnd() {
    const end = document.querySelector<HTMLElement>('#chapter-end')!; end.hidden = false;
    end.querySelector('section>small')!.textContent = this.state.currentMonth;
    end.querySelector('h2')!.textContent = this.options.ending ?? '秋招还在继续。';
    end.querySelector('p')!.textContent = `${getRoute(this.state.currentRoute).trainName} · ${this.options.endingSubtitle ?? '第一章结束'}`;
    if (this.options.endingJob) { end.querySelector('section>small')!.textContent = this.options.endingSubtitle!; end.querySelector('p')!.textContent = this.state.civilServiceFinalJob ?? ''; }
    if (this.options.endingDetail) { end.querySelector('section>small')!.textContent = this.options.endingSubtitle!; end.querySelector('p')!.textContent = this.options.endingDetail(this.state); }
    document.querySelector('#chapter-save-status')!.textContent = this.saved ? (this.state.currentRoute === 'employment' ? '第一章进度已保存在本机。' : '当前进度已保存在本机。') : '本机保存未成功，当前进度仍保留在此页面。';
    document.querySelector<HTMLElement>('#chapter-save-retry')!.hidden = this.saved;
    if (this.options.quietEnding) {
      this.surface.dataset.quietEnding = 'true';
      end.querySelector('section>small')!.textContent = '2027.07'; end.querySelector('p')!.textContent = '';
      if (this.saved) document.querySelector('#chapter-save-status')!.textContent = '';
    }
  }
  private tick = (now: number) => {
    const dt = this.previous ? Math.min((now - this.previous) / 1000, .05) : 0; this.previous = now;
    const clock = document.querySelector<HTMLElement>('#quiz-clock')!;
    const remaining = this.quizActive ? this.quiz?.remaining() : null;
    clock.hidden = remaining == null;
    if (remaining != null) {
      clock.textContent = `模拟行测 · 剩余 ${remaining === 60 ? '01:00' : `00:${String(remaining).padStart(2, '0')}`}`;
      clock.dataset.urgent = String(remaining <= 10);
      if (remaining === 0) this.endTimedQuiz();
    }
    this.surface.dataset.presentation = this.presentation ?? '';
    if (!document.hidden) {
      if (this.mode !== 'complete') this.state.playSeconds += dt;
      if (this.sequenceStep >= 0) {
        this.sequenceTime += dt;
        if (this.sequenceTime >= this.sequence[this.sequenceStep].seconds) {
          this.sequenceTime = 0; this.sequenceStep++;
          if (this.sequenceStep === this.sequence.length) {
            this.sequenceStep = -1; this.presentation = undefined; document.querySelector<HTMLElement>('#life-transition')!.hidden = true;
            if (this.afterSequence) { this.setMode('dialogue'); this.showScript(this.script(this.afterSequence)); }
            else this.finishEvent('complete');
          } else this.showSequence();
        }
      }
      this.updateHud();
      const free = this.events.current?.freeTime;
      if (free) {
        const id = this.events.current!.id;
        const elapsed = this.state.gapFreeElapsed ??= {};
        elapsed[id] = Math.min(free.seconds, (elapsed[id] ?? 0) + dt);
        if (this.mode === 'exploring' && this.player.motion === 'idle') {
          const before=elapsed[id+':idle'] ?? 0; elapsed[id+':idle']=before+dt;
          if(before<10 && elapsed[id+':idle']>=10) recordAction(this.state,'idle');
        }
        this.freeSaveTime += dt;
        if (this.freeSaveTime > 5) { this.freeSaveTime = 0; this.saved = saveChapter(this.state); }
        if (this.mode === 'exploring' && elapsed[id] >= free.seconds) {
          
          this.events.begin(this.state.location, this.events.current!.target);
          const seq = Object.values(this.events.current!.sequences ?? {})[0];
          if (seq) { this.sequence = seq.steps; this.afterSequence = seq.next; this.sequenceStep = 0; this.sequenceTime = 0; this.setMode('transition'); this.showSequence(); }
          else this.finishEvent('complete');
        }
      }
      if (!this.events.current?.freeTime && this.mode === 'exploring' && this.events.current?.trigger === 'auto' && this.events.current.id !== this.autoOpenedId && this.events.canTrigger(this.state.location, this.events.current.target)) this.openEvent(this.events.current.target);
      if (this.mode === 'exploring') {
        this.player.update(this.joystick.value, dt);
        if (free && this.player.motion === 'walk' && !this.state.gapFreeElapsed?.[this.events.current!.id+':walk']) { (this.state.gapFreeElapsed ??= {})[this.events.current!.id+':walk']=1; recordAction(this.state, 'walk'); this.saved = saveChapter(this.state); }
        const target = this.interactions.update(this.player);
        if ((target?.id ?? null) !== this.lastTarget) {
          this.lastTarget = target?.id ?? null;
          const object = this.objects.find(o => o.id === target?.id);
          this.button.setTarget(target ? { label: target.prompt, icon: target.icon, verb: object?.to ? '进入' : object?.kind === 'computer' ? '使用' : undefined,
            onInteract: () => this.interactions.activate(this.player, this.mode === 'exploring') } : null);
        }
      }
      this.draw(now / 1000);
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  private draw(time: number) {
    const c = this.ctx;
    c.fillStyle = '#cbded1'; c.fillRect(0, 0, 360, this.height);
    if (this.presentation && this.presentation !== 'photo' && this.presentation !== 'ambient') {
      const panel = this.mode === 'dialogue' ? document.querySelector('.dialogue-panel')!.getBoundingClientRect().top - this.surface.getBoundingClientRect().top : this.surface.clientHeight;
      const top = Math.max(15, Math.min(180, panel / this.surface.clientWidth * 360 - 263));
      c.save(); c.translate(0, top);
      this.vignette.draw(c, this.presentation, this.hero, this.npcs, time, this.sequenceStep >= 0 ? this.sequenceTime / this.sequence[this.sequenceStep].seconds : 0, this.options.endingDetail?.(this.state) ?? this.events.text('{{civilServiceFinalJob}}'), this.state.gapTravelStyle);
      c.restore(); return;
    }
    // Keep the protagonist above the shared dialogue panel on short phones.
    let lift = 0;
    if (this.mode === 'dialogue') {
      const panelY = document.querySelector('.dialogue-panel')!.getBoundingClientRect().top - this.surface.getBoundingClientRect().top;
      lift = Math.max(0, this.originY + this.player.y - (panelY - 16) / this.surface.clientWidth * 360);
    }
    c.save(); c.translate(0, Math.round(this.originY - lift)); c.drawImage(this.terrain, 0, 0);
    if (this.traveling) drawTravel(c, this.state.gapTravelStyle ?? 'seaside', time);
    if (this.state.currentRoute === 'gap' && this.state.currentMonth >= '2027年6月' && !this.traveling) {
      c.fillStyle='#fff0d2';c.fillRect(127,55,100,26);c.fillStyle='#657d68';c.font='11px sans-serif';c.fillText('27届 · 毕业季',137,73);
      for (const x of [20,310]) { c.fillStyle='#b99365';c.fillRect(x,300,27,25);c.fillStyle='#ddc395';c.fillRect(x+2,302,23,5);c.fillStyle='#8f7858';c.fillRect(x+12,300,2,25); }
      if(this.state.location==='campus') { this.npcs.draw(c,'commuter-cv',81,193);this.npcs.draw(c,'commuter-ddl',287,208,1); }
    }
    if (this.events.current?.freeTime?.clock) {
      const f=this.events.current.freeTime, t=this.state.gapFreeElapsed?.[this.events.current.id]??0;
      c.fillStyle=t>f.seconds*2/3?'#50678b24':t>f.seconds/3?'#e5a56316':'#ffffff00';c.fillRect(0,0,360,390);
      if(this.state.location==='dorm') {
        c.fillStyle='#af8e68';c.fillRect(283,261,39,12);c.fillStyle='#f4e9c9';c.fillRect(289,255,25,9);c.fillStyle='#8fa69a';c.fillRect(301,256,1,8);
        c.fillStyle='#839894';c.fillRect(45,305,30,11);c.fillStyle='#475f5c';c.fillRect(49,308,7,3);c.fillRect(51,306,3,7);c.fillRect(68,309,3,3);
      }else if(this.state.location==='campus') { c.fillStyle='#f7edcf';c.fillRect(303,284,30,22);c.fillStyle='#7d967e';c.fillRect(308,289,20,2);c.fillRect(308,295,16,2); }
      for(const a of this.freeActions.filter(a=>a.location===this.state.location)) { const o=a.target; c.fillStyle='#f7edcf';c.fillRect(o.x-17,o.y+8,34,12);c.fillStyle='#627b6a';c.font='9px sans-serif';c.fillText(a.id==='learn'?'教程':a.id==='play'?'游戏':a.id==='part-time'?'兼职':'· · ·',o.x-12,o.y+18); }
    }
    if (this.mode === 'exploring') {
      const active = this.events.current;
      for (const o of this.objects) {
        if (this.interactions.current?.id === o.id || (this.state.playSeconds >= (this.state.eventReadyAt ?? 0) && active?.target === o.id && (active.location === this.state.location || active.location === 'any'))) {
          c.fillStyle = '#fff4bc'; c.fillRect(o.x - 15, o.y + 4, 30, 2);
          c.fillStyle = '#68856b'; c.fillRect(o.x - 16, o.y + 6, 32, 1);
          if (active?.target === o.id && this.state.playSeconds >= (this.state.eventReadyAt ?? 0)) { c.fillStyle = '#4e7060'; c.font = 'bold 12px monospace'; c.fillText('· · ·', o.x - 14, o.y - 83 + (this.reducedMotion ? 0 : Math.sin(time * 2) * 2)); }
        }
      }
    }
    if ((this.traveling || this.events.current?.freeTime) && this.state.location==='campus') this.npcs.draw(c,'commuter-cv',35+(time*14)%285,340,Math.floor(time*3)%2);
    const friend = () => this.npcs.draw(c, 'commuter-book', 224, 280, this.reducedMotion ? 0 : Math.floor(time / 2) % 2);
    if (this.state.location === 'campus' && this.player.y >= 280) friend();
    this.hero.draw(c, this.player, this.reducedMotion);
    if (this.state.location === 'campus' && this.player.y < 280) friend();
    if(this.presentation==='photo') { c.strokeStyle='#fff2d0';c.lineWidth=5;c.strokeRect(18,8,324,365);c.fillStyle='#fff2d0';c.fillRect(18,343,324,30);c.fillStyle='#526e61';c.font='12px sans-serif';c.fillText('发送给朋友',142,362); }
    c.restore();
    if(this.events.current?.id==='gap-last-walk' && this.sequenceStep>=0) { c.fillStyle=`rgba(231,237,216,${this.sequenceTime/3})`;c.fillRect(0,0,360,this.height); }
  }
  snapshot() { return { scene: 'life', location: this.state.location, x: this.player.x, y: this.player.y, motion: this.player.motion,
    input: { ...this.joystick.value }, mode: this.mode, interactionId: this.interactions.current?.id, dialogueId: this.dialogue.scriptId,
    initialRoute: this.state.initialRoute, currentRoute: this.state.currentRoute, chapter: structuredClone(this.state), saved: this.saved }; }
  destroy() {
    clearTimeout(this.timer); cancelAnimationFrame(this.frame); this.observer.disconnect(); this.abort.abort();
    this.joystick.destroy(); this.button.destroy(); this.panel.destroy(); this.activity.destroy(); this.documents.destroy();
    delete this.surface.dataset.presentation; document.querySelector<HTMLElement>('#quiz-clock')!.hidden = true;
  }
}
