import { useMemo } from 'react';
import { formatValue } from '../../../../../components/calc';
import { CategoryBarChart } from '../../../../../components/charts';
import type { CategorySeries, ChartAxis } from '../../../../../components/charts';
import type { WallResultChartProps } from '../types/wall-result-chart-props.type';

const CATEGORIES = ['Into the wall (inner)', 'Out of the wall (outer)'];
const Y_AXIS: ChartAxis = { title: 'Heat flow', unit: 'W', min: 0 };
const PERCENT = 100;

export function HeatFluxChart({ result }: WallResultChartProps) {
  const series = useMemo<CategorySeries[]>(() => [{ name: 'Heat flow', data: [result.fluxInner_W, result.fluxOuter_W] }], [result]);
  const mismatch = result.fluxInner_W !== 0 ? (Math.abs(result.fluxInner_W - result.fluxOuter_W) / result.fluxInner_W) * PERCENT : 0;
  return (
    <CategoryBarChart
      title="Heat flux balance"
      subtitle={`Inner vs outer mismatch ${formatValue(mismatch)} %`}
      categories={CATEGORIES}
      series={series}
      yAxis={Y_AXIS}
    />
  );
}
