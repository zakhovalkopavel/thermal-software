/**
 * Quartic polynomial coefficients.
 * Common refs: Yaws1999, Borgnakke
 *
 * f(T) = a + b·T + c·T² + d·T³ + e·T⁴
 */
export type QuarticEquation = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
};
