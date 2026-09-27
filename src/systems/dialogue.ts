export type Presentation = 'trip-depart' | 'ambient' | 'travel' | 'rest' | 'small-bag' | 'project' | 'meal' | 'photo' | 'waiting' | 'interview' | 'morning' | 'door' | 'enter' | 'black' | 'packing' | 'packing-extra' | 'depart';
export interface DialogueChoice { id: string; text: string; next?: string; action?: string }
export interface DialogueNode { speaker: string; lines: string[]; next?: string; choices?: DialogueChoice[]; presentation?: Presentation; tone?: 'correct' | 'incorrect' }
export interface DialogueScript { id: string; start: string; nodes: Record<string, DialogueNode> }
export interface DialogueView { speaker: string; text: string; choices: DialogueChoice[]; last: boolean; presentation?: Presentation; tone?: DialogueNode['tone'] }

export class DialogueSystem {
  private script: DialogueScript | null = null;
  private nodeId = '';
  private line = 0;
  private ended: ((action?: string) => void) | null = null;
  constructor(private changed: (view: DialogueView | null) => void, private selected?: (id: string) => void) {}
  get active() { return this.script !== null; }
  get scriptId() { return this.script?.id ?? null; }

  open(script: DialogueScript, ended: (action?: string) => void) {
    if (this.active) return false;
    if (!script.nodes[script.start]) throw new Error(`Missing dialogue start: ${script.id}`);
    for (const node of Object.values(script.nodes)) {
      if (!node.lines.length) throw new Error(`Empty dialogue: ${script.id}`);
      for (const next of [node.next, ...(node.choices ?? []).map(choice => choice.next)]) {
        if (next && !script.nodes[next]) throw new Error(`Missing dialogue node: ${next}`);
      }
    }
    this.script = script; this.nodeId = script.start; this.line = 0; this.ended = ended;
    this.publish(); return true;
  }
  continue() {
    const node = this.script?.nodes[this.nodeId];
    if (!node) return;
    if (this.line < node.lines.length - 1) this.line++;
    else if (node.choices?.length) return;
    else if (node.next) { this.nodeId = node.next; this.line = 0; }
    else { this.close(); return; }
    this.publish();
  }
  choose(id: string) {
    const node = this.script?.nodes[this.nodeId];
    if (!node || this.line !== node.lines.length - 1) return;
    const choice = node.choices?.find(item => item.id === id);
    if (!choice) return;
    this.selected?.(choice.id);
    if (choice.next) { this.nodeId = choice.next; this.line = 0; this.publish(); }
    else this.close(choice.action);
  }
  close(action?: string) {
    if (!this.active) return;
    const ended = this.ended;
    // Clear before invoking callbacks: double taps cannot submit an action twice.
    this.script = null; this.ended = null;
    this.changed(null); ended?.(action);
  }
  private publish() {
    const node = this.script!.nodes[this.nodeId];
    const endOfNode = this.line === node.lines.length - 1;
    this.changed({ speaker: node.speaker, text: node.lines[this.line], presentation: node.presentation, tone: node.tone,
      choices: endOfNode ? node.choices ?? [] : [],
      last: endOfNode && !node.next });
  }
}
