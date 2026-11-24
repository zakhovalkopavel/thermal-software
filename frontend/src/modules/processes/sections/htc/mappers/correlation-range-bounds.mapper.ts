import type { CorrelationRange } from '../types/correlation-range.type';

export function toRangeBounds(range: CorrelationRange): { min: number; max: number } {
  const [min, max] = range;
  return { min, max: max === 'Infinity' ? Number.POSITIVE_INFINITY : max };
}
