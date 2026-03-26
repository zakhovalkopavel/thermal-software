/**
 * DIPPR Correlation 102 coefficients.
 * Common refs: Perry9, DIPPR_Doc
 *
 * f(T) = c1·T^c2 / (1 + c3/T + c4/T²)
 *
 * No closed-form antiderivative for arbitrary c2 — numerical integration used.
 */
export type DipprN102Equation = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
};
