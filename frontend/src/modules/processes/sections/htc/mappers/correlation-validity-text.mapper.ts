import type { CorrelationInfo } from '../types/correlation-info.type';
import { toRangeText } from './correlation-range-text.mapper';

const RANGE_KEYS = ['Re', 'Pr', 'Ra'] as const;

/** "Re 3000 – 5e+6, Pr 0.5 – 2000"; empty when the backend lists no range. */
export function toValidityText(correlation: CorrelationInfo): string {
  return RANGE_KEYS.flatMap((key) => {
    const range = correlation[key];
    return range ? [`${key} ${toRangeText(range)}`] : [];
  }).join(', ');
}
