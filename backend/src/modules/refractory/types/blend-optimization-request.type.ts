import type { BlendOptimizationOptions } from './blend-optimization-options.type';
import type { Fraction } from './fraction.type';

/** Complete blend optimization request. */
export type BlendOptimizationRequest = {
  /** Array of particle size fractions */
  fractions: Fraction[];

  /** Optional optimization parameters */
  options?: BlendOptimizationOptions;
};
