/**
 * DIPPR Correlation 101 coefficients (liquid viscosity, vapour pressure).
 * Common refs: Perry8, DIPPR_Doc
 *
 * f(T) = exp(c1 + c2/T + c3·ln(T) + c4·T^c5)
 *
 * No closed-form antiderivative — numerical integration used.
 */
export type DipprN101Equation = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
};
