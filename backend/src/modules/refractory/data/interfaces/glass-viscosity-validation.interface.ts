/**
 * Interfaces for glass viscosity validation dataset.
 *
 * These are data-layer types — they describe reference glass entries used
 * in tests and documentation, not service request/response shapes.
 *
 * Moved here from glass-viscosity-validation.data.ts per architecture rule:
 *   "Interfaces must live in data/interfaces, not in data files."
 */

export interface GlassIsokomPoint {
  /** log₁₀(η / Pa·s) */
  logEta: number;
  /** Temperature in °C — model regression output (used for implementation correctness check) */
  T_model_C: number;
  /** Temperature in °C — experimentally measured (where available, used for physical sanity check) */
  T_measured_C?: number;
}

export interface GlassValidationEntry {
  /** Short identifier matching the source paper (e.g. '710A', 'S1', 'Fluegel-DGG-I') */
  id: string;
  /** Human-readable description */
  description: string;
  /** Full bibliographic reference */
  source: string;
  /**
   * Composition in wt% — the input format accepted by the service.
   * For Fluegel reference glasses this is derived from mol% via:
   *   wt_i = mol_i × M_i, then normalised to 100%.
   */
  composition_wt_pct: Record<string, number>;
  /**
   * Composition in mol% — as published in the primary source.
   * Only present where the primary source reports mol% (Fluegel 2007 Table 1).
   * For Lakatos 1976 the primary source is wt%, so this field is absent.
   */
  composition_mol_pct?: Record<string, number>;
  /** Isokom temperature points from model regression or direct measurement */
  isokoms: GlassIsokomPoint[];
  /** Expected ViscosityModel enum key for this glass */
  expectedModel: string;
  /**
   * Maximum allowed deviation in °C between implementation output and
   * the paper model values (T_model_C).  NOT vs experiment — that tests the
   * physical model accuracy, not the implementation correctness.
   */
  tolerance_model_C: number;
}

