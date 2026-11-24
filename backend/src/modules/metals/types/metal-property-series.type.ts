import { MetalPropertyApproximation } from './metal-property-approximation.type';

export type MetalPropertySeries = {
  unit: string;
  sources: string[];
  /** Own measured knots only — never a donor copy. */
  points: Array<{ T_K: number; value: number }>;
  /** Equation fit stored on the alloy record (quadratic ≤ Ac3, linear above / indenCp). */
  approximation?: MetalPropertyApproximation;
};
