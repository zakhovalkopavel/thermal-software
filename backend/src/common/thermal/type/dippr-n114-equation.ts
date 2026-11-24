/**
 * DIPPR Correlation 114 coefficients (liquid heat capacity).
 * Common refs: Perry8, DIPPR_Doc
 *
 * f(T) = c1²/τ + c2 − 2·c1·c3·τ − c1·c4·τ² − c3²·τ³/3 − c3·c4·τ⁴/2 − c4²·τ⁵/5,  τ = 1 − T/Tc
 */
export type DipprN114Equation = {
  /** Critical temperature [K] */
  Tc: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
};
