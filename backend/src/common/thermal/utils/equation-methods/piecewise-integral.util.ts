import { temperatureRangeIndex } from './temperature-range-index.util';

/**
 * Cumulative, continuous integral of a piecewise function from `ranges[0].Tmin` to T.
 *
 * Range i covers (Tmax[i−1], Tmax[i]] — the same selection as `temperatureRangeIndex` — so the result is the
 * exact integral of the evaluated function even when the source ranges leave a gap.
 *
 * @param F  Antiderivative of one range
 */
export function piecewiseIntegral<R extends { Tmin: number; Tmax: number }>(
  T: number, ranges: ReadonlyArray<R>, F: (T: number, range: R) => number,
): number {
  const index = temperatureRangeIndex(T, ranges);
  let sum = 0;
  let lower = ranges[0].Tmin;
  for (let i = 0; i < index; i++) {
    sum += F(ranges[i].Tmax, ranges[i]) - F(lower, ranges[i]);
    lower = ranges[i].Tmax;
  }
  return sum + F(T, ranges[index]) - F(lower, ranges[index]);
}
