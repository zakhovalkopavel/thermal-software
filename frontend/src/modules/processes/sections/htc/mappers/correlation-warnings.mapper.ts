import { formatValue } from '../../../../../components/calc';
import type { CorrelationInfo } from '../types/correlation-info.type';
import type { DimensionlessResult } from '../types/dimensionless-result.type';
import { toRangeBounds } from './correlation-range-bounds.mapper';
import { toRangeText } from './correlation-range-text.mapper';

const RANGE_KEYS = ['Re', 'Pr', 'Ra'] as const;

export function toCorrelationWarnings(correlation: CorrelationInfo | undefined, result: DimensionlessResult): string[] {
  if (!correlation) return [];
  return RANGE_KEYS.flatMap((key) => {
    const range = correlation[key];
    if (!range) return [];
    const { min, max } = toRangeBounds(range);
    const value = result[key];
    return value < min || value > max
      ? [`${key} = ${formatValue(value)} is outside the validity range of ${correlation.name} (${toRangeText(range)}).`]
      : [];
  });
}
