/**
 * One temperature range of a Zabransky cubic spline.
 * ref: Zabransky1996
 *
 * Cp/R = a1 + a2·θ + a3·θ² + a4·θ³,  θ = T/100
 */
export type ZabranskySplineRange = {
  /** Lower bound of this range [K] */
  Tmin: number;
  /** Upper bound of this range [K] */
  Tmax: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
};
