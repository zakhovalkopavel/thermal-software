import type { TemperatureRange } from '../types/temperature-range.type';

export function isEmissivityClamped(T_K: number, range: TemperatureRange): boolean {
  return T_K < range.min || T_K > range.max;
}
