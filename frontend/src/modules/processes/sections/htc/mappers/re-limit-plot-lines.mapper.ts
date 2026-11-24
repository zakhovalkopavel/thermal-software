import { formatValue } from '@/shared/ui/calc';
import type { PlotLine } from '@/shared/ui/charts';
import type { CorrelationInfo } from '../types/correlation-info.type';
import type { VelocitySweepPoint } from '../types/velocity-sweep-point.type';
import { toRangeBounds } from './correlation-range-bounds.mapper';

/** Velocities at the correlation's Re bounds: w = w_ref · Re_limit / Re_ref, since Re ∝ w at fixed T, fluid and geometry. */
export function toReLimitPlotLines(points: VelocitySweepPoint[], correlation: CorrelationInfo | undefined): PlotLine[] {
  const reference = points.find((point) => point.result && point.result.Re > 0);
  if (!correlation?.Re || !reference?.result) return [];
  const rePerVelocity = reference.result.Re / reference.w_m_s;
  const { min, max } = toRangeBounds(correlation.Re);
  return [min, max]
    .filter((re) => re > 0 && Number.isFinite(re))
    .map((re): PlotLine => ({ value: re / rePerVelocity, label: `${correlation.name}: Re = ${formatValue(re)}`, dashStyle: 'Dash' }));
}
