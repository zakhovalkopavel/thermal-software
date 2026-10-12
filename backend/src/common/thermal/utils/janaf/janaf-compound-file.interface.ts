import { JanafTable } from './janaf-table.interface';

/**
 * One compound file: `inorganic/<Element>/<formula>-<name>.json` or `organic/<family>/<formula>-<name>.json`,
 * holding every table (phases, polymorphs) of one Hill formula, e.g. "inorganic/Ti/TiO2-titanium-oxide.json".
 * Units of the row columns: `units.json` (`JanafUnitsFile`).
 */
export interface JanafCompoundFile {
  /** Class of the compound-data record, else the formula rule (halocarbons such as CCl4 are organic) */
  class: 'inorganic' | 'organic';
  /** Main element (TiO2 → "Ti", NH3 → "N"), organic family of the compound-data record, or "other" (e-) */
  group: string;
  /** IUPAC element order for inorganic ("TiO2", "NH3", "Al+"), Hill for organic; names the file */
  displayFormula: string;
  /** Hill formula with the charge of ions ("Al+") and isotope symbols ("D2O"); the `byFormula` key */
  hill: string;
  /** Keyed by table id, in py-janaf index order */
  tables: Record<string, JanafTable>;
}
