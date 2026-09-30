import { useMemo } from 'react';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps, XYSeries } from '../../../../../components/charts';
import { toReLimitPlotLines } from '../mappers/re-limit-plot-lines.mapper';
import { toVelocitySweepSeries } from '../mappers/velocity-sweep-series.mapper';
import type { HtcVelocityChartProps } from '../types/htc-velocity-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Gas velocity w', unit: 'm/s' };
const Y_AXES: ChartAxis[] = [
  { title: 'h', unit: 'W/(m²·K)' },
  { title: 'Re', type: 'logarithmic', opposite: true },
];

export function HtcVelocityChart({ points, correlation }: HtcVelocityChartProps) {
  const series = useMemo<XYSeries[]>(() => {
    const { h, re } = toVelocitySweepSeries(points);
    return [
      { name: 'h', data: h, unit: 'W/(m²·K)', emphasis: true, showMarkers: true },
      { name: 'Re', data: re, yAxis: 1, dashStyle: 'Dash' },
    ];
  }, [points]);
  const limits = useMemo(() => toReLimitPlotLines(points, correlation), [points, correlation]);

  return (
    <XYLineChart
      title="Heat-transfer coefficient vs velocity"
      caption={
        correlation?.Re
          ? `Vertical lines: velocities at the Re bounds of ${correlation.name}.`
          : 'Select a correlation with an Re range to mark its validity limits.'
      }
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotLines={limits}
    />
  );
}
