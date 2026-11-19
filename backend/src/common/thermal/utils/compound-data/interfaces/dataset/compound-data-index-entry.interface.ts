import { RefKey } from '../../../../enum/ref-key.enum';
import { CompoundDataEquations } from '../equation/compound-data-equations.interface';
import { CompoundDataPhase } from '../../types/property/compound-data-phase.type';
import { CompoundDataProperties } from '../property/compound-data-properties.interface';
import { CompoundDataTransport } from '../transport/compound-data-transport.interface';

/**
 * Summary of one record; the record is at `file` → `entries[entry]`.
 * Null and empty fields are left out.
 */
export interface CompoundDataIndexEntry {
  /** Public catalogue id (name slug; `_1`/`_2`/… when names collide); equals the map key */
  compoundId: string;
  /** Compound file relative to the dataset folder, e.g. "inorganic/Ti/TiO2-titanium-dioxide.json" */
  file: string;
  /** Hill formula, as in `CompoundDataCompoundFile.hill` */
  hill: string;
  /** As in `CompoundDataCompoundFile.displayFormula` */
  displayFormula: string;
  /** Key in `CompoundDataCompoundFile.entries`: the CAS, or "noCas" */
  entry: string;
  /** As in `CompoundDataRecord.cas` (records without CAS that a PubChem formula search identified) */
  cas?: string;
  /** Source formula when it differs from `hill` */
  formula?: string;
  name?: string;
  /** Alternate names, as in `CompoundDataRecord.synonyms` */
  synonyms?: string[];
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
  /** CoolProp fluid names, as in `CompoundDataRecord.coolprop` */
  coolprop?: string[];
  /** As in `CompoundDataRecord.otherCas` */
  otherCas?: string[];
}
