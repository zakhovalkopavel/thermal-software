import { CompoundDataUnresolvedEntry } from './compound-data-unresolved-entry.type';

/** `unresolved.json`: source rows whose CAS or formula could not be resolved */
export type CompoundDataUnresolvedFile = {
  generatedAt: string;
  count: number;
  entries: CompoundDataUnresolvedEntry[];
}
