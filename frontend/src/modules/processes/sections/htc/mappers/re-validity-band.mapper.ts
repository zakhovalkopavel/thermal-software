import type { PlotBand } from '@/shared/ui/charts';
import type { CorrelationInfo } from '../types/correlation-info.type';
import { toRangeBounds } from './correlation-range-bounds.mapper';

/** The correlation's Re range clipped to the swept Re values (log axes cannot show 0 or ∞). */
export function toReValidityBand(correlation: CorrelationInfo | undefined, reValues: number[]): PlotBand[] {
  if (!correlation?.Re || reValues.length === 0) return [];
  const { min, max } = toRangeBounds(correlation.Re);
  const from = Math.max(min, Math.min(...reValues));
  const to = Math.min(max, Math.max(...reValues));
  return from < to ? [{ from, to, label: `${correlation.name} valid` }] : [];
}
