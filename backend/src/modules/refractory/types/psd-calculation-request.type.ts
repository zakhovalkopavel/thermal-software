import type { PSDCalculationOptions } from './psd-calculation-options.type';
import type { PSDFraction } from './psd-fraction.type';

/** Complete PSD calculation request. */
export type PSDCalculationRequest = {
  /** Array of particle size fractions */
  fractions: PSDFraction[];

  /** Distribution modulus (typically 0.2-0.4) */
  q: number;

  /** Optional calculation parameters */
  options?: PSDCalculationOptions;
};
