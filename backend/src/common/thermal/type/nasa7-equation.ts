import { Nasa7Coeffs } from './nasa7-coeffs';

/**
 * NASA 7-coefficient polynomial for a species — two temperature ranges.
 * ref: NASA7
 *
 * low  range: 200 K – Tswitch
 * high range: Tswitch – 6000 K
 */
export type Nasa7Equation = {
  low:     Nasa7Coeffs;
  high:    Nasa7Coeffs;
  /** Temperature switch between low/high ranges [K], typically 1000 K */
  Tswitch: number;
};
