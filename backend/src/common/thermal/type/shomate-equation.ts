import { ShomateRange } from './shomate-range';

/**
 * Piecewise Shomate equation — ranges sorted by Tmin, contiguous (Tmax[i] === Tmin[i+1]).
 * ref: NISTWebBook
 */
export type ShomateEquation = {
  ranges: ShomateRange[];
};
