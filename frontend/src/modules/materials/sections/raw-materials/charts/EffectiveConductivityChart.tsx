import { useMemo } from 'react';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { toRawMaterialThermalSeries } from '../mappers/raw-material-thermal-series.mapper';
import type { RawMaterialThermalChartProps } from '../types/raw-material-thermal-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = {
  title: 'T',
  unit: '°C',
  tooltipExtra: (x) => chartFormat.value(celsiusToKelvin(x), 'K'),
};
const Y_AXES: ChartAxis[] = [{ title: 'λ_eff', unit: 'W/(m·K)' }];

export function EffectiveConductivityChart({ points, names, porosity, includeDense }: RawMaterialThermalChartProps) {
  const series = useMemo(
    () => toRawMaterialThermalSeries(points, names, 'lambda_WmK', porosity, includeDense),
    [points, names, porosity, includeDense],
  );
  return (
    <XYLineChart
      title="Effective thermal conductivity λ_eff(T)"
      subtitle={`Porosity P = ${porosity}`}
      caption="Dense λ(T) from the library reference, Maxwell–Eucken with air-filled pores"
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
    />
  );
}
