import { CHART_THEME } from '@/shared/ui/charts';
import type { PlotBand } from '@/shared/ui/charts';
import type { TemperatureRange } from '../types/temperature-range.type';

/** Shaded x-bands where ε is clamped, limited to the plotted range [xMin, xMax] (chart x unit). */
export function toClampedBands(
  range: TemperatureRange,
  xMin: number,
  xMax: number,
  label: string,
  toX: (T_K: number) => number = (T_K) => T_K,
): PlotBand[] {
  const bands: PlotBand[] = [];
  const low = toX(range.min);
  const high = toX(range.max);
  if (xMin < low) bands.push({ from: xMin, to: Math.min(low, xMax), label, color: CHART_THEME.warningBandColor });
  if (xMax > high) bands.push({ from: Math.max(high, xMin), to: xMax, label, color: CHART_THEME.warningBandColor });
  return bands;
}
