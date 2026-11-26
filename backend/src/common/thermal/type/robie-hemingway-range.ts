/**
 * One temperature range of a Robie–Hemingway five-term heat-capacity fit.
 * Ref: RobieHemingway1995 (USGS Bulletin 2131)
 *
 * Cp = A1 + A2·T + A3/T² + A4/T^0.5 + A5·T²  (J·mol⁻¹·K⁻¹, T in K)
 */
export type RobieHemingwayRange = {
  /** Lower bound of this range [K] */
  Tmin: number;
  /** Upper bound of this range [K] */
  Tmax: number;
  A1: number;
  A2: number;
  A3: number;
  A4: number;
  A5: number;
};
