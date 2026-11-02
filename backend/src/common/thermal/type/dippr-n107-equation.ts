/**
 * DIPPR Equation 107 coefficients (proposed by Aly and Lee).
 * Common refs: Perry7 (p. 2-150), Perry9
 *
 * Cp = c1 + c2·[c3/T / sinh(c3/T)]² + c4·[c5/T / cosh(c5/T)]²
 */
export type DipprN107Equation = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
};
