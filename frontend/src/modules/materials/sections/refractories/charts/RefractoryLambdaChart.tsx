import { useMemo } from 'react';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { toRefractoryPropertySeries } from '../mappers/refractory-property-series.mapper';
import type { RefractoryChartProps } from '../types/refractory-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = {
  title: 'T',
  unit: '°C',
  tooltipExtra: (x) => chartFormat.value(celsiusToKelvin(x), 'K'),
};
const Y_AXES: ChartAxis[] = [{ title: 'λ', unit: 'W/(m·K)' }];

export function RefractoryLambdaChart({ products, byMaterial }: RefractoryChartProps) {
  const series = useMemo(() => toRefractoryPropertySeries(byMaterial, products, 'lambda_WmK'), [byMaterial, products]);
  return <XYLineChart title="Thermal conductivity λ(T)" xAxis={X_AXIS} yAxes={Y_AXES} series={series} />;
}
