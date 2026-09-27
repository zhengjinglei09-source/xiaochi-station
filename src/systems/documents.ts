export interface UploadFile { id: string; displayName: string; documentType: string; targetSlot?: string; isDecoy?: boolean }
export interface UploadDefinition {
  title: string; folder: string; files: UploadFile[]; slots: { id: string; label: string }[];
  uploaded: string[]; requiredCount: number; next: string;
}
// A file belongs to one slot. Invalid drops never change progress.
export class DocumentUpload {
  uploaded: Set<string>;
  constructor(readonly data: UploadDefinition) { this.uploaded = new Set(data.uploaded.filter(id => data.slots.some(s => s.id === id))); }
  drop(fileId: string, slotId: string) {
    const file = this.data.files.find(f => f.id === fileId);
    if (!file || file.isDecoy || file.targetSlot !== slotId || !this.data.slots.some(s => s.id === slotId)) return false;
    this.uploaded.add(slotId); return true;
  }
  get ready() { return this.uploaded.size >= this.data.requiredCount; }
}
