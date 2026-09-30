import type { XYSeries } from '../../../../../components/charts';
import type { VelocitySweepPoint } from '../types/velocity-sweep-point.type';

/** One series per correlation the backend picked, so switches between correlations are visible. */
export function toNuReSeries(points: VelocitySweepPoint[]): XYSeries[] {
  const byCorrelation = new Map<string, [number, number][]>();
  points.forEach(({ result }) => {
    if (!result || result.Re <= 0 || result.Nu <= 0) return;
    const data = byCorrelation.get(result.correlation) ?? [];
    data.push([result.Re, result.Nu]);
    byCorrelation.set(result.correlation, data);
  });
  return [...byCorrelation.entries()].map(([name, data]): XYSeries => ({ name, data, showMarkers: true }));
}
