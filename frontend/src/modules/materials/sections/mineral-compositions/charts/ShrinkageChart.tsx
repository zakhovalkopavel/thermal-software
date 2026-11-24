import { useMemo } from 'react';
import { formatValue } from '@/shared/ui/calc';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, PlotLine, XYLineChartProps } from '@/shared/ui/charts';
import { toShrinkageSeries } from '../mappers/shrinkage-series.mapper';
import type { ShrinkageChartProps } from '../types/shrinkage-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'T', unit: '°C' };
const Y_AXES: ChartAxis[] = [{ title: 'Linear shrinkage', unit: '%', min: 0 }];

export function ShrinkageChart({ result }: ShrinkageChartProps) {
  const series = useMemo(() => toShrinkageSeries(result), [result]);
  const totalLinear = result.total.shrinkage_linear_percent[result.total.shrinkage_linear_percent.length - 1] as number | undefined;
  const plotLines: PlotLine[] =
    totalLinear !== undefined ? [{ value: totalLinear, label: `Total ${formatValue(totalLinear)} %`, dashStyle: 'Dash' }] : [];

  return (
    <XYLineChart
      title="Shrinkage vs firing temperature"
      subtitle={`${result.metadata.method}; first point = drying (${formatValue(result.drying.temperatures_C[0])} °C)`}
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      yPlotLines={plotLines}
    />
  );
}
