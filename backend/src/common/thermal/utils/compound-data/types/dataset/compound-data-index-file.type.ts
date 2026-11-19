import { CompoundDataEquationType } from '../../types/equation/compound-data-equation-type.type';
import { CompoundDataIndexEntry } from './compound-data-index-entry.type';

/** `index.json` */
export type CompoundDataIndexFile = {
  generatedAt: string;
  count: number;
  equationTypes: Partial<Record<CompoundDataEquationType, 'implemented' | 'planned'>>;
  /** Keyed by public `compoundId` (name slug; `_1`/`_2`/… when names collide) */
  compounds: Record<string, CompoundDataIndexEntry>;
  /** Hill formula → compoundIds */
  byFormula: Record<string, string[]>;
  /** Element → compoundIds */
  byElement: Record<string, string[]>;
  /** Organic family → compoundIds */
  byFamily: Record<string, string[]>;
  /** Primary CAS → compoundId */
  byCas?: Record<string, string>;
  /** Moved CAS (`otherCas`) → compoundId */
  byOtherCas: Record<string, string>;
}
