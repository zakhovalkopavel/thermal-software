import type { RefractorinessStandard } from './refractoriness-standard.type';

/** Refractoriness calculation input. */
export type RefractorinessInput = {
  /** Oxide composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Standards to calculate */
  standards?: RefractorinessStandard[];

  /** Duty class for classification */
  dutyClass?: 'low' | 'intermediate' | 'high';

  /** Test load pressure (MPa) — default 0.2 for ISO 1893 */
  testLoadPressure_MPa?: number;
};
