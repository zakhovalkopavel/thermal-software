import { useMemo } from 'react';
import { formatValue } from '../../../../../components/calc';
import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import { toMassBalanceSeries } from '../mappers/mass-balance-series.mapper';
import type { MassBalanceChartProps } from '../types/mass-balance-chart-props.type';

const CATEGORIES = ['In', 'Out'];
const Y_AXIS: ChartAxis = { title: 'Mass flow', unit: 'kg/s', min: 0 };

export function MassBalanceChart({ summary }: MassBalanceChartProps) {
  const series = useMemo(() => toMassBalanceSeries(summary), [summary]);
  const residual = summary.lastStep.elementBalanceResidual;
  return (
    <CategoryBarChart
      title="Mass balance"
      subtitle={`Element balance residual ${formatValue(residual)}`}
      categories={CATEGORIES}
      series={series}
      yAxis={Y_AXIS}
      stacking="normal"
      showLegend
    />
  );
}
