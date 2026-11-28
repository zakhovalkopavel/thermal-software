import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { toWallPropertySeries } from '../mappers/wall-property-series.mapper';
import type { WallPropertyChartProps } from '../types/wall-property-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Wall temperature', unit: '°C' };
const Y_AXES: ChartAxis[] = [
  { title: 'λ', unit: 'W/(m·K)' },
  { title: 'ε', unit: '—', opposite: true },
];

export function WallPropertyChart({ result }: WallPropertyChartProps) {
  const profile = result.wallPropertyProfile;
  const series = useMemo(() => (profile ? toWallPropertySeries(profile) : []), [profile]);
  if (!profile?.length) return null;

  return (
    <XYLineChart
      title="Wall λ / ε from material"
      caption={`Material ${result.wallMaterial ?? '—'}: conductivity and emissivity evaluated along the wall temperature range of this run.`}
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
    />
  );
}
