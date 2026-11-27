import { RobieHemingwayRange } from './robie-hemingway-range';

/**
 * Piecewise Robie–Hemingway Cp equation — ranges sorted by Tmin.
 * Ref: RobieHemingway1995 (USGS Bulletin 2131)
 *
 * Cp = A1 + A2·T + A3/T² + A4/T^0.5 + A5·T²
 */
export type RobieHemingwayEquation = {
  ranges: RobieHemingwayRange[];
};
