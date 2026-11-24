import { Nasa9Coeffs } from './nasa9-coeffs';

/**
 * NASA 9-coefficient polynomial for a species — variable number of temperature ranges.
 * ref: NASA9
 *
 * NASA-9 supports arbitrary range splits; common databases use 2–3 ranges, e.g.:
 *   200–1000 K / 1000–6000 K / 6000–20000 K
 *
 * Each range is stored as { Tmin, Tmax, coeffs }.
 */
export type Nasa9Range = {
  /** Lower bound of this range [K] */
  Tmin: number;
  /** Upper bound of this range [K] */
  Tmax: number;
  coeffs: Nasa9Coeffs;
};
