import { CompoundDataRecord } from './compound-data-record.interface';

/**
 * One compound file: `inorganic/<Element>/<formula>-<name>.json` holds every record of one Hill formula
 * (several CAS, polymorphs); `organic/<family>/<formula>-<name>.json` holds one record.
 * The file name starts with `displayFormula`, e.g. "inorganic/Ti/TiO2-titanium-dioxide.json".
 * Units of all values: `units.json` (`CompoundDataUnitsFile`).
 */
export interface CompoundDataCompoundFile {
  /** Organic: a C–H, C–halogen bond (or, without metals, C–C, C–NH or a carbon ring); halocarbons are organic */
  class: 'inorganic' | 'organic';
  /** Main element (inorganic: Al2O3 → "Al", TiO2 → "Ti", NH3 → "N") or first functional family (organic) */
  group: string;
  /** IUPAC element order for inorganic compounds ("TiO2", "NH3", "ZnB4O9"), Hill for organic ("C2H6O") */
  displayFormula: string;
  /** Hill formula, the lookup key of `index.json` `byFormula` ("O2Ti", "H3N") */
  hill: string;
  elements: string[];
  /** Keyed by CAS; "noCas" for the record without CAS (its record id when a formula has two) */
  entries: Record<string, CompoundDataRecord>;
}
