import { RefKey } from '../../enum/ref-key.enum';
import { CompoundDataEquationType } from './compound-data-equation-type.type';
import { CompoundDataEquations } from './compound-data-equations.interface';
import { CompoundDataPhase } from './compound-data-phase.type';
import { CompoundDataProperties } from './compound-data-properties.interface';
import { CompoundDataTransport } from './compound-data-transport.interface';

/**
 * Summary of one record; the record is at `file` → `entries[entry]`.
 * Null and empty fields are left out.
 */
export interface CompoundDataIndexEntry {
  /** Compound file relative to the dataset folder, e.g. "inorganic/Ti/TiO2-titanium-dioxide.json" */
  file: string;
  /** Hill formula, as in `CompoundDataCompoundFile.hill` */
  hill: string;
  /** As in `CompoundDataCompoundFile.displayFormula` */
  displayFormula: string;
  /** Key in `CompoundDataCompoundFile.entries`: the CAS, or "noCas" */
  entry: string;
  /** Source formula when it differs from `hill` */
  formula?: string;
  name?: string;
  class: 'inorganic' | 'organic';
  group: string;
  families?: string[];
  refs: RefKey[];
  properties?: (keyof CompoundDataProperties)[];
  equations?: Partial<Record<keyof CompoundDataEquations, CompoundDataPhase[]>>;
  /** Properties of `CompoundDataRecord.transport` */
  transport?: (keyof CompoundDataTransport)[];
  /** NIST-JANAF table ids, as in `CompoundDataRecord.janaf` */
  janaf?: string[];
  /** NASA-7 species keys, as in `CompoundDataRecord.nasa7` */
  nasa7?: string[];
  /** NASA-9 species keys, as in `CompoundDataRecord.nasa9` */
  nasa9?: string[];
  /** As in `CompoundDataRecord.otherCas` */
  otherCas?: string[];
}

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
