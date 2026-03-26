/**
 * Linear-hyperbolic polynomial coefficients (Szargut form).
 * Common refs: Szargut, Perry7
 *
 * f(T) = a + b·T + d/T²
 */
export type LinearHyperbolicEquation = {
  a: number;
  b: number;
  /** Coefficient of the 1/T² term */
  d: number;
};
