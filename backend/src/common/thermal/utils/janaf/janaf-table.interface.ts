import { JanafRef } from './janaf-ref.type';
import { JanafRow } from './janaf-row.interface';
import { JanafTransition } from './janaf-transition.interface';

/** One NIST-JANAF table, keyed by its table id in `JanafCompoundFile.tables`; null and empty fields are left out */
export interface JanafTable {
  name: string;
  /** Conventional formula from the table title, e.g. "TiO2" */
  formula?: string;
  /** JANAF formula from the header, e.g. "O2Ti1" */
  janafFormula: string;
  /** JANAF phase code, e.g. "cr,l", "g", "ref" */
  phase?: string;
  /** Display label from the py-janaf index, e.g. "O2Ti, Titanium Oxide (cr,l)" */
  label?: string;
  /** Title line of the table file */
  ref: JanafRef;
  rows?: JanafRow[];
  transitions?: JanafTransition[];
}
