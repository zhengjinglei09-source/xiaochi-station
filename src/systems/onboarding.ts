export type Hint = 'movement' | 'platform' | 'info' | 'conductor' | null;
export interface TutorialFlags {
  hasMoved: boolean;
  hasViewedStationInfo: boolean;
  hasTalkedToConductor: boolean;
  hasSeenPlatformHint: boolean;
  hasExploredPlatforms: boolean;
}

// Visit-local guidance: two distinct platform signs, not a timer or repeated reads.
export class Onboarding {
  readonly flags: TutorialFlags = { hasMoved: false, hasViewedStationInfo: false, hasTalkedToConductor: false, hasSeenPlatformHint: false, hasExploredPlatforms: false };
  private time = 0;
  private distance = 0;
  private movementReminded = false;
  private movementEmphasisUntil = 2.4;
  private target: 'info' | 'conductor' | null = null;
  private viewedPlatforms = new Set<string>();

  update(dt: number, movedDistance: number, engaged: boolean, target: 'info' | 'conductor' | null) {
    this.time += dt;
    this.distance += movedDistance;
    this.target = target;
    if (!this.flags.hasMoved && this.distance >= 3) this.flags.hasMoved = true;
    if (this.flags.hasMoved) this.flags.hasSeenPlatformHint = true;
    if (!this.flags.hasMoved && !engaged && this.time >= 7 && !this.movementReminded) {
      this.movementReminded = true; this.movementEmphasisUntil = this.time + 2.4;
    }
  }
  complete(kind: 'info' | 'conductor', platformId?: string) {
    if (kind === 'info') {
      this.flags.hasViewedStationInfo = true;
      if (platformId) this.viewedPlatforms.add(platformId);
      this.flags.hasExploredPlatforms = this.viewedPlatforms.size >= 2;
    } else this.flags.hasTalkedToConductor = true;
  }
  get viewedPlatformIds() { return [...this.viewedPlatforms]; }
  get platformVisible() { return this.flags.hasMoved && !this.flags.hasExploredPlatforms; }
  get contextHint(): 'info' | 'conductor' | null {
    if (this.target === 'conductor' && !this.flags.hasTalkedToConductor) return 'conductor';
    if (this.target === 'info' && !this.flags.hasViewedStationInfo) return 'info';
    return null;
  }
  get hint(): Hint { return this.contextHint ?? (this.platformVisible ? 'platform' : this.flags.hasMoved ? null : 'movement'); }
  get emphasis() {
    return !this.flags.hasMoved && this.time < this.movementEmphasisUntil ? (this.movementReminded ? 'reminder' : 'initial') : '';
  }
}
