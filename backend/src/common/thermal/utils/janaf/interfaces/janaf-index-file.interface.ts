/** Summary of one table; the table is at `file` → `tables[id]`. Null fields are left out. */
export interface JanafIndexEntry {
  /** Hill formula of the compound file, with the charge of ions, e.g. "O2Ti", "Al+" */
  hill: string;
  /** As in `JanafCompoundFile.displayFormula`, e.g. "TiO2" */
  displayFormula: string;
  /** Formula from the table title, e.g. "TiO2" */
  formula?: string;
  janafFormula: string;
  name: string;
  phase?: string;
  label?: string;
  class: 'inorganic' | 'organic';
  group: string;
  /** Compound file relative to the dataset folder, e.g. "inorganic/Ti/TiO2-titanium-oxide.json" */
  file: string;
}

/** `index.json` */
export interface JanafIndexFile {
  generatedAt: string;
  count: number;
  /** Keyed by table id */
  tables: Record<string, JanafIndexEntry>;
  /** Hill formula (with charge) → table ids of all phases */
  byFormula: Record<string, string[]>;
  /** Element of the JANAF formula → table ids */
  byElement: Record<string, string[]>;
  /** Organic family → table ids */
  byFamily: Record<string, string[]>;
}
