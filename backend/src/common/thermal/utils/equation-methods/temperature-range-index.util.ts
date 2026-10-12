/**
 * Index of the range used at T: the first range with T ≤ Tmax, else the last range (as `nasa9`).
 */
export function temperatureRangeIndex(T: number, ranges: ReadonlyArray<{ Tmax: number }>): number {
  const index = ranges.findIndex(r => T <= r.Tmax);
  return index === -1 ? ranges.length - 1 : index;
}
