import { STANDARD_CONDITIONS } from '../../../constants/standard-conditions.constants';

/** Solver settings for inverting vapour-pressure equations to Tb(P). */
export const BOILING_TEMPERATURE = {
  /** Nominal T used when picking a covering vapour-pressure equation (standard room T). */
  preferT_K: STANDARD_CONDITIONS.TEMPERATURE_K,
  binarySearchIterations: 60,
  /** Relative tolerance when checking that P lies inside Psat[min, max]. */
  pressureSpanTolerance: 0.001,
} as const;
