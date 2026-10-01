import { useMemo } from 'react';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { TEMPERATURE_SWEEP } from '../../../constants/temperature-sweep.constants';
import { toRawMaterialThermalSeries } from '../mappers/raw-material-thermal-series.mapper';
import type { RawMaterialThermalChartProps } from '../types/raw-material-thermal-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = {
  title: 'T',
  unit: '°C',
  tooltipExtra: (x) => chartFormat.value(x + TEMPERATURE_SWEEP.KELVIN_OFFSET, 'K'),
};
const Y_AXES: ChartAxis[] = [{ title: 'Cp', unit: 'J/(kg·K)' }];

export function SpecificHeatChart({ points, names, porosity }: RawMaterialThermalChartProps) {
  const series = useMemo(() => toRawMaterialThermalSeries(points, names, 'cp_JkgK', porosity, false), [points, names, porosity]);
  return <XYLineChart title="Specific heat Cp(T)" xAxis={X_AXIS} yAxes={Y_AXES} series={series} />;
}
