/**
 * Structured boundary status for a thermophysical equation evaluation.
 *
 * Policy: warn-and-clamp for empirical equations; NASA H/S/G may extrapolate
 * with boundary Cp and report `action: 'extrapolated'`.
 */
export type ValidityAction = 'none' | 'clamped' | 'extrapolated';

export interface EquationValidity {
  /** Temperature the caller requested [K] */
  requestedT: number;
  /**
   * Temperature used by the base correlation [K].
   * For clamp: the clamped T. For NASA extrapolation of H/S/G: still the
   * boundary T at which Cp was taken (the result itself is at requestedT).
   */
  effectiveT: number;
  /** Correlation lower T bound [K]; null when the source range is unknown */
  min: number | null;
  /** Correlation upper T bound [K]; null when the source range is unknown */
  max: number | null;
  /** True when requestedT is inside a known [min, max] */
  inRange: boolean;
  /** True when the source did not publish a temperature range */
  rangeUnknown: boolean;
  action: ValidityAction;
  message?: string;
  /** Optional second endpoint for average evaluations [K] */
  requestedT2?: number;
  effectiveT2?: number;
  /** Pressure the caller requested [Pa], when pressure limits apply */
  requestedP?: number;
  effectiveP?: number;
  minP?: number | null;
  maxP?: number | null;
}

/** Point (or average) evaluation with numeric value + boundary metadata */
export interface EvaluationResult {
  value: number;
  validity: EquationValidity;
}

/** Mixture aggregate: per-component flags plus overall in-range */
export interface MixtureValidity {
  allInRange: boolean;
  components: Record<string, EquationValidity>;
}
