import { formatValue } from '../../../../../components/calc';
import type { CorrelationRange } from '../types/correlation-range.type';
import { toRangeBounds } from './correlation-range-bounds.mapper';

export function toRangeText(range: CorrelationRange): string {
  const { min, max } = toRangeBounds(range);
  return `${formatValue(min)} – ${Number.isFinite(max) ? formatValue(max) : '∞'}`;
}
