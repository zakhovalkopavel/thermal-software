import type { TemperatureRange } from '../types/temperature-range.type';

export function isEmissivityClamped(T_K: number, range?: TemperatureRange): boolean {
  if (!range) return false;
  return T_K < range.min || T_K > range.max;
}
