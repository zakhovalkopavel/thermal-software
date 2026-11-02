import { CompoundDataEquationType } from '../equation/compound-data-equation-type.type';
import { CompoundDataIndexEntry } from './compound-data-index-entry.interface';

/** `index.json` */
export interface CompoundDataIndexFile {
  generatedAt: string;
  count: number;
  equationTypes: Partial<Record<CompoundDataEquationType, 'implemented' | 'planned'>>;
  /** Keyed by record id: the CAS, or "formula:<formula>" without CAS */
  compounds: Record<string, CompoundDataIndexEntry>;
  /** Hill formula → record ids */
  byFormula: Record<string, string[]>;
  /** Element → record ids */
  byElement: Record<string, string[]>;
  /** Organic family → record ids */
  byFamily: Record<string, string[]>;
  /** Moved CAS (`otherCas`) → record id */
  byOtherCas: Record<string, string>;
}
