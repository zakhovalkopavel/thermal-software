/**
 * Cubic polynomial coefficients.
 * Common refs: Borgnakke, Yaws1999
 *
 * f(T) = a + b·T + c·T² + d·T³
 */
export type CubicEquation = {
  a: number;
  b: number;
  c: number;
  d: number;
};
