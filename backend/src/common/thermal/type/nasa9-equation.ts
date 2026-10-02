import { Nasa9Range } from './nasa9-range';

/**
 * Full NASA-9 entry for a species — ordered list of temperature ranges.
 * Ranges must be contiguous and non-overlapping (Tmax[i] === Tmin[i+1]).
 */
export type Nasa9Equation = {
  ranges: Nasa9Range[];
};
