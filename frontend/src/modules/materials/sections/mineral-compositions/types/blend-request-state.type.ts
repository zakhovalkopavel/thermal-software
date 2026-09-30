import type { BlendOptimizationInput } from './blend-optimization-input.type';

export type BlendRequestState = {
  input: BlendOptimizationInput;
  /** Mix fraction ids in request order; results' `massFractions` follow this order. */
  fractionIds: string[];
  /** Fraction labels at request time. */
  labels: string[];
};
