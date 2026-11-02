import { CompoundDataUnresolvedEntry } from './compound-data-unresolved-entry.interface';

/** `unresolved.json`: source rows whose CAS or formula could not be resolved */
export interface CompoundDataUnresolvedFile {
  generatedAt: string;
  count: number;
  entries: CompoundDataUnresolvedEntry[];
}
