import { useCallback, useMemo } from 'react';
import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import { toCpComparisonBars } from '../mappers/cp-comparison-bars.mapper';
import type { CpComparisonChartProps } from '../types/cp-comparison-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'Cp', unit: 'J/(mol·K)' };

export function CpComparisonChart({ species, T_K, entries }: CpComparisonChartProps) {
  const { categories, series, mean } = useMemo(() => toCpComparisonBars(entries), [entries]);
  const tooltipExtra = useCallback(
    (index: number) => {
      const entry = entries[index];
      const deviation = mean ? ((entry.value - mean) / mean) * 100 : 0;
      return `Deviation from mean: ${deviation >= 0 ? '+' : ''}${deviation.toFixed(2)} %${entry.rangeValid ? '' : '<br/>Outside validity range'}`;
    },
    [entries, mean],
  );

  return (
    <CategoryBarChart
      title={`Cp approximations — ${species} at ${T_K} K`}
      subtitle="Grey bars: temperature outside the method's validity range"
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      tooltipExtra={tooltipExtra}
      height={300}
    />
  );
}
