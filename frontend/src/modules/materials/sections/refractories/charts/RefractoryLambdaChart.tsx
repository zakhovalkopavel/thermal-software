import { useMemo } from 'react';
import { XYLineChart, chartFormat } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps } from '../../../../../components/charts';
import { TEMPERATURE_SWEEP } from '../../../constants/temperature-sweep.constants';
import { toRefractoryPropertySeries } from '../mappers/refractory-property-series.mapper';
import type { RefractoryChartProps } from '../types/refractory-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = {
  title: 'T',
  unit: '°C',
  tooltipExtra: (x) => chartFormat.value(x + TEMPERATURE_SWEEP.KELVIN_OFFSET, 'K'),
};
const Y_AXES: ChartAxis[] = [{ title: 'λ', unit: 'W/(m·K)' }];

export function RefractoryLambdaChart({ products, byMaterial }: RefractoryChartProps) {
  const series = useMemo(() => toRefractoryPropertySeries(byMaterial, products, 'lambda_WmK'), [byMaterial, products]);
  return <XYLineChart title="Thermal conductivity λ(T)" xAxis={X_AXIS} yAxes={Y_AXES} series={series} />;
}
