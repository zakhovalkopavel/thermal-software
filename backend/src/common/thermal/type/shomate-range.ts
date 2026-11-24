/**
 * One temperature range of a Shomate equation.
 * ref: NISTWebBook
 *
 * Cp = a + b·T + c·T² + d·T³ + e/T²  (T in K)
 */
export type ShomateRange = {
  /** Lower bound of this range [K] */
  Tmin: number;
  /** Upper bound of this range [K] */
  Tmax: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
};
