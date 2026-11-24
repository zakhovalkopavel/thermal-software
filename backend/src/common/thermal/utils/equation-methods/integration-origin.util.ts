import { STANDARD_CONDITIONS } from '../../constants/standard-conditions.constants';

/**
 * Lower bound of a numerical `integral`: `min` when finite, else 298.15 K
 * (the compound-data dataset maps a missing range to ±Infinity).
 */
export function integrationOrigin(min: number): number {
  return Number.isFinite(min) ? min : STANDARD_CONDITIONS.THERMOCHEMICAL_REFERENCE_TEMPERATURE_K;
}
