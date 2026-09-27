// Small data-only interactions; no route logic or scoring lives in the panel.
export type ActivityField = 'gapTravelStyle' | 'gapTravelItems' | 'gapExperiment' | 'civilServiceFirstFilters' | 'civilServiceSecondFilters' | 'civilServiceFirstJob' | 'civilServiceSecondJob' | 'civilServiceEssayChoices' | 'civilServiceExamOrder' | 'abroadRegion' | 'abroadApplicationMethod' | 'abroadAgencyPackage' | 'abroadAppliedSchools' | 'abroadAcceptedSchool';
export interface ActivityDefinition {
  title: string; kind: 'filters' | 'single' | 'multi' | 'order'; field: ActivityField;
  options: { id: string; label: string; detail?: string }[];
  min?: number; max?: number; counts?: number[]; materials?: string[];
  part?: 'problems' | 'measures'; intro?: string; storeIds?: boolean; submit?: string; next: string;
}
export class ActivitySelection {
  selected: string[] = [];
  constructor(readonly data: ActivityDefinition) {}
  toggle(id: string) {
    if (!this.data.options.some(o => o.id === id)) return;
    if (this.selected.includes(id)) this.selected = this.selected.filter(v => v !== id);
    else if (this.data.kind === 'single') this.selected = [id];
    else if (this.selected.length < (this.data.max ?? this.data.options.length)) this.selected.push(id);
  }
  get valid() { const n = this.selected.length; return n >= (this.data.min ?? this.data.options.length) && n <= (this.data.max ?? this.data.options.length); }
  get values() { return this.selected.map(id => this.data.storeIds ? id : this.data.options.find(o => o.id === id)!.label); }
  get count() { return this.data.counts?.[this.selected.length]; }
}
