/** Summary of one table; the table is at `file` → `tables[id]`. Null fields are left out. */
export type JanafIndexEntry = {
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
};
