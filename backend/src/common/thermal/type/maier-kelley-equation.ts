/**
 * Maier–Kelley equation coefficients (1932).
 * Common refs: Szargut, Perry7, Perry8 Table 2-151
 *
 * f(T) = a + b·T + d/T²
 */
export type MaierKelleyEquation = {
  a: number;
  b: number;
  /** Coefficient of the 1/T² term */
  d: number;
};
