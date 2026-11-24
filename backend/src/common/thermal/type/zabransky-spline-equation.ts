import { ZabranskySplineRange } from './zabransky-spline-range';

/**
 * Piecewise Zabransky liquid heat capacity — ranges sorted by Tmin, contiguous.
 * ref: Zabransky1996
 */
export type ZabranskySplineEquation = {
  ranges: ZabranskySplineRange[];
};
