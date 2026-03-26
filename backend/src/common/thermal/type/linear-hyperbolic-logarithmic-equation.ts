/**
 * Linear-hyperbolic-logarithmic polynomial coefficients.
 * Common refs: Perry9, DIPPR_Doc
 *
 * f(T) = c1 + c2·ln T + c3/T + c4·T
 */
export type LinearHyperbolicLogarithmicEquation = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
};
