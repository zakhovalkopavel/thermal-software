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
const Y_AXES: ChartAxis[] = [{ title: 'ε', unit: '–', min: 0, max: 1 }];

export function RefractoryEmissivityChart({ products, byMaterial }: RefractoryChartProps) {
  const series = useMemo(() => toRefractoryPropertySeries(byMaterial, products, 'emissivity'), [byMaterial, products]);
  return (
    <XYLineChart
      title="Emissivity ε(T)"
      subtitle="Dotted segments: outside the ε validity range (value clamped)"
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
    />
  );
}
