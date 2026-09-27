import { CONFIG } from './config';
import { Player } from './player';
import { DynamicJoystick } from '../input/joystick';
import { CharacterRenderer } from '../assets/character';
import { InteractionButton } from '../ui/interaction';
import { drawBackdrop, drawGround, drawArchitecture, drawObject, drawAmbient, station } from './scenery';
import { RouteState, getRoute, type RouteId } from '../content/routes';
import { createStationInteractions, platforms, type Platform } from '../content/station-content';
import { InteractionSystem } from '../systems/interaction';
import { DialogueSystem, type DialogueScript } from '../systems/dialogue';
import { DialoguePanel } from '../ui/dialogue';
import { StationActors, drawTrains, drawRouteSign, drawInteractionHighlight } from './station-actors';
import { BoardingSequence } from './boarding';
import { Onboarding } from '../systems/onboarding';
import { OnboardingHints } from '../ui/onboarding';
import { onPress } from '../ui/press';

type StationMode = 'exploring' | 'dialogue' | 'boarding' | 'complete';

export class Game {
  readonly player = new Player();
  readonly joystick: DynamicJoystick;
  private ctx: CanvasRenderingContext2D;
  private character = new CharacterRenderer();
  private frame = 0;
  private previous = 0;
  private elapsed = 0;
  private width = CONFIG.logicalWidth;
  private height = 640;
  private originY = 173;
  private backdrop = document.createElement('canvas');
  private ground = document.createElement('canvas');
  private observer: ResizeObserver;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private mode: StationMode = 'exploring';
  private routes = new RouteState();
  private abort = new AbortController();
  private actors = new StationActors();
  private interactions: InteractionSystem;
  private interactionButton: InteractionButton;
  private dialogue: DialogueSystem;
  private dialoguePanel: DialoguePanel;
  private boarding: BoardingSequence | null = null;
  private renderedTargetId: string | null = null;
  private dialogueCameraLift = 0;
  private onboarding = new Onboarding();
  private onboardingHints = new OnboardingHints();

  constructor(private surface: HTMLElement, private canvas: HTMLCanvasElement, private enterLife?: (id: RouteId) => void, returning?: { initialRoute: RouteId; currentRoute: RouteId }) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('当前浏览器不支持 Canvas 2D');
    this.ctx = ctx;
    delete surface.dataset.scene;
    surface.setAttribute('aria-label', '小迟去哪儿，人生车站');
    canvas.setAttribute('aria-label', '人生车站。左侧拖动移动，靠近站牌、列车员和车门后可交互。');
    for (const id of ['life-hud', 'chapter-end', 'life-transition', 'phase-complete', 'dialogue-layer']) document.querySelector<HTMLElement>(`#${id}`)!.hidden = true;
    document.querySelector('h1')!.textContent = '人生车站';
    document.querySelector('.location div>span')!.textContent = 'LIFE STATION';
    document.querySelector('.platform')!.innerHTML = '01 <small>站台</small>';
    document.querySelector('.caption span')!.textContent = '余小迟的第一站';
    if (returning) {
      this.routes.initialRoute = returning.initialRoute; this.routes.currentRoute = returning.currentRoute;
      Object.assign(this.onboarding.flags, { hasMoved: true, hasViewedStationInfo: true, hasTalkedToConductor: true, hasSeenPlatformHint: true, hasExploredPlatforms: true });
    }
    onPress(document.querySelector('#station-return')!, () => {
      document.querySelector<HTMLElement>('#phase-complete')!.hidden = true;
      this.player.x = station.spawn.x; this.player.y = station.spawn.y; this.boarding = null; this.setMode('exploring');
    }, { signal: this.abort.signal });
    this.joystick = new DynamicJoystick(surface, document.querySelector('#joystick')!, document.querySelector('#joystick-knob')!, () => this.player.stop());
    this.interactionButton = new InteractionButton(document.querySelector('#interaction')!);
    this.interactions = new InteractionSystem(createStationInteractions((script, platform) => this.openDialogue(script, platform)));
    this.dialoguePanel = new DialoguePanel(document.querySelector('#dialogue-layer')!,
      () => this.dialogue.continue(), id => this.dialogue.choose(id), () => this.dialogue.close());
    this.dialogue = new DialogueSystem(view => {
      this.dialoguePanel.render(view);
      this.frameDialogue();
    });
    this.surface.dataset.mode = this.mode;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(surface);
    this.resize();
  }
  async start() {
    await Promise.all([this.character.load(), this.actors.load()]);
    this.resize();
    this.canvas.dataset.ready = 'true';
    this.frame = requestAnimationFrame(this.tick);
  }
  private resize() {
    this.joystick.reset();
    this.height = Math.round(this.surface.clientHeight / this.surface.clientWidth * this.width);
    this.canvas.width = this.width; this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
    this.originY = Math.max(112, Math.min(this.height - 399, this.height * .29));
    const screenScale = this.surface.clientHeight / this.height;
    this.surface.style.setProperty('--movement-top', `${(this.originY + 296) * screenScale}px`);
    this.surface.style.setProperty('--arrow-top', `${(this.originY + 320) * screenScale}px`);
    // Bake static pixel scenery once per resize; each frame only moves layers.
    this.backdrop.width = CONFIG.mapWidth; this.backdrop.height = this.height;
    this.ground.width = CONFIG.mapWidth; this.ground.height = this.height;
    drawBackdrop(this.backdrop.getContext('2d')!, CONFIG.mapWidth, this.height, this.originY, 0);
    const groundContext = this.ground.getContext('2d')!;
    drawGround(groundContext, this.height - this.originY);
    drawArchitecture(groundContext);
    drawTrains(groundContext, this.actors.renderer);
    this.frameDialogue();
  }
  private frameDialogue() {
    this.dialogueCameraLift = 0;
    if (this.mode !== 'dialogue') return;
    const panel = document.querySelector<HTMLElement>('.dialogue-panel')!.getBoundingClientRect();
    const surface = this.surface.getBoundingClientRect();
    const scale = this.width / surface.width;
    const visibleFeetY = (panel.top - surface.top - 14) * scale;
    this.dialogueCameraLift = Math.max(0, this.originY + this.player.y - visibleFeetY);
  }
  private tick = (now: number) => {
    const dt = this.previous ? Math.min((now - this.previous) / 1000, .05) : 0;
    this.previous = now;
    if (!document.hidden) {
      this.elapsed += dt;
      if (this.mode === 'exploring') {
        const previousX = this.player.x, previousY = this.player.y;
        this.player.update(this.joystick.value, dt);
        this.actors.update(dt);
        this.refreshInteraction();
        this.onboarding.update(dt, Math.hypot(this.player.x - previousX, this.player.y - previousY),
          this.surface.dataset.steering === 'true', this.tutorialTarget());
      } else if (this.mode === 'boarding' && this.boarding?.update(dt)) {
        this.finishBoarding();
      }
      this.refreshInteraction();
      this.onboardingHints.render(this.onboarding, this.mode === 'exploring');
      this.render();
    }
    this.frame = requestAnimationFrame(this.tick);
  };
  private render() {
    const c = this.ctx;
    const cameraX = Math.round(Math.max(0, Math.min(CONFIG.mapWidth - this.width, this.player.x - this.width * .56)));
    const lift = this.mode === 'dialogue' ? this.dialogueCameraLift : 0;
    c.drawImage(this.backdrop, -Math.round(cameraX * .28), -Math.round(lift));
    c.save(); c.translate(-cameraX, Math.round(this.originY - lift));
    c.drawImage(this.ground, 0, 0);
    const layers = station.obstacles.map(o => ({ y: o.y + o.height, draw: () => drawObject(c, o) }));
    for (const platform of platforms) layers.push({ y: platform.sign.y, draw: () => {
      drawRouteSign(c, platform);
      if (this.mode === 'exploring' && this.onboarding.platformVisible)
        this.onboardingHints.drawPlatformMarker(c, platform.sign.x, platform.sign.y, this.elapsed, this.reducedMotion);
    } });
    for (const actor of this.actors.layers(this.reducedMotion, this.interactions.current?.id === 'talk-attendant')) layers.push({ y: actor.y, draw: () => actor.draw(c) });
    drawInteractionHighlight(c, this.interactions.current, this.elapsed, this.reducedMotion);
    if (this.mode !== 'complete') layers.push({ y: this.player.y, draw: () => {
      c.save(); c.globalAlpha = this.boarding?.opacity ?? 1;
      this.character.draw(c, this.player, this.reducedMotion); c.restore();
    } });
    layers.sort((a, b) => a.y - b.y).forEach(layer => layer.draw());
    if (this.mode === 'exploring') this.actors.drawBubble(c, cameraX, this.width);
    drawAmbient(c, this.elapsed, this.reducedMotion);
    c.restore();
  }
  snapshot() {
    return { x: this.player.x, y: this.player.y, motion: this.player.motion, direction: this.player.direction,
      input: { ...this.joystick.value }, width: this.width, height: this.height, originY: this.originY,
      mode: this.mode, interactionId: this.interactions.current?.id ?? null, dialogueId: this.dialogue.scriptId,
      initialRoute: this.routes.initialRoute, currentRoute: this.routes.currentRoute,
      boardingProgress: this.boarding?.progress ?? null,
      dialogueCameraLift: this.mode === 'dialogue' ? this.dialogueCameraLift : 0,
      tutorial: { ...this.onboarding.flags, hint: this.mode === 'exploring' ? this.onboarding.hint : null, emphasis: this.onboarding.emphasis,
        platformVisible: this.mode === 'exploring' && this.onboarding.platformVisible, viewedPlatformIds: this.onboarding.viewedPlatformIds,
        movementVisible: this.mode === 'exploring', movementGroundY: 296 },
      commuters: this.actors.commuters.map(({ id, x, y }) => ({ id, x, y })),
    };
  }
  private setMode(mode: StationMode) {
    this.mode = mode; this.surface.dataset.mode = mode;
    this.joystick.setEnabled(mode === 'exploring');
    this.player.stop();
    this.refreshInteraction();
  }
  private refreshInteraction() {
    const target = this.interactions.update(this.player, this.mode === 'exploring');
    if ((target?.id ?? null) === this.renderedTargetId) return;
    this.renderedTargetId = target?.id ?? null;
    this.interactionButton.setTarget(target ? { label: target.prompt, icon: target.icon,
      onInteract: () => this.interactions.activate(this.player, this.mode === 'exploring') } : null);
  }
  private openDialogue(script: DialogueScript, platform?: Platform) {
    if (this.mode !== 'exploring') return;
    // Talking to staff at a train door also counts, even if the player skips the central attendant.
    const tutorialTarget = this.tutorialTarget() ?? (platform ? 'conductor' : null);
    this.setMode('dialogue');
    const opened = this.dialogue.open(script, action => {
      if (action === 'board' && platform) {
        this.boarding = new BoardingSequence(platform, this.player);
        this.setMode('boarding');
        document.querySelector<HTMLElement>('#boarding-feedback')!.hidden = false;
      } else this.setMode('exploring');
    });
    if (opened && tutorialTarget) this.onboarding.complete(tutorialTarget,
      script.id.startsWith('information-') ? script.id.slice('information-'.length) : undefined);
  }
  private tutorialTarget(): 'info' | 'conductor' | null {
    const target = this.interactions.current;
    if (target?.type === 'sign') return 'info';
    return target?.id === 'talk-attendant' ? 'conductor' : null;
  }
  private finishBoarding() {
    if (!this.boarding || this.mode !== 'boarding') return;
    this.routes.recordBoarding(this.boarding.platform.route.id);
    this.setMode('complete');
    document.querySelector<HTMLElement>('#boarding-feedback')!.hidden = true;
    if (this.enterLife) queueMicrotask(() => this.enterLife!(this.routes.currentRoute!));
    if (this.routes.currentRoute === 'employment' || this.routes.currentRoute === 'postgrad' || this.routes.currentRoute === 'civil_service' || this.routes.currentRoute === 'abroad' || this.routes.currentRoute === 'gap') return;
    const route = getRoute(this.routes.currentRoute!);
    document.querySelector('#completion-title')!.textContent = `已登上${route.trainName}`;
    document.querySelector<HTMLElement>('#phase-complete')!.hidden = false;
  }
  destroy() { this.abort.abort(); cancelAnimationFrame(this.frame); this.observer.disconnect(); this.joystick.destroy(); this.dialoguePanel.destroy(); this.interactionButton.destroy(); }
}
