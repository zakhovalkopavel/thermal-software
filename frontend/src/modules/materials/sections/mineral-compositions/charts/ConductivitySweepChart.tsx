import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { toConductivitySweepSeries } from '../mappers/conductivity-sweep-series.mapper';
import type { ConductivitySweepChartProps } from '../types/conductivity-sweep-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'T', unit: '°C' };
const Y_AXES: ChartAxis[] = [{ title: 'λ_eff', unit: 'W/(m·K)' }];

export function ConductivitySweepChart({ results, porosity }: ConductivitySweepChartProps) {
  const series = useMemo(() => toConductivitySweepSeries(results, porosity), [results, porosity]);

  return (
    <XYLineChart
      title="Effective thermal conductivity λ_eff(T)"
      caption="Fired phases + Maxwell–Eucken (air pores); dashed = dense (P = 0)"
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
    />
  );
}
