import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, PlotLine, XYLineChartProps, XYSeries } from '@/shared/ui/charts';
import type { ExcessAirSweepChartProps } from '../types/excess-air-sweep-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Excess air λ' };
const Y_AXES: ChartAxis[] = [
  { title: 'Flame T', unit: 'K' },
  { title: 'Flue gas', unit: 'kg/s', opposite: true },
];

export function ExcessAirSweepChart({ points, kExcessAir }: ExcessAirSweepChartProps) {
  const series = useMemo<XYSeries[]>(
    () => [
      {
        name: 'Flame T',
        unit: 'K',
        emphasis: true,
        data: points.flatMap((point) => (point.tFlame_K !== undefined ? [[point.kExcessAir, point.tFlame_K] as [number, number]] : [])),
      },
      {
        name: 'Flue gas',
        unit: 'kg/s',
        yAxis: 1,
        dashStyle: 'Dash',
        data: points.flatMap((point) => (point.mGas_kgs !== undefined ? [[point.kExcessAir, point.mGas_kgs] as [number, number]] : [])),
      },
    ],
    [points],
  );
  const plotLines: PlotLine[] = kExcessAir !== undefined ? [{ value: kExcessAir, label: `λ = ${kExcessAir}` }] : [];
  const failed = points.filter((point) => point.error).map((point) => point.kExcessAir);
  return (
    <XYLineChart
      title="Excess-air sweep"
      subtitle={failed.length > 0 ? `Not calculated at λ = ${failed.join(', ')}` : undefined}
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotLines={plotLines}
    />
  );
}
