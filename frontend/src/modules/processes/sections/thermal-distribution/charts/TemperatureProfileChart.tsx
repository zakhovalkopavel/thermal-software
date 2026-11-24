import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { toBoundaryPlotLines } from '../mappers/boundary-plot-lines.mapper';
import { toProfileSeries } from '../mappers/profile-series.mapper';
import type { TemperatureProfileChartProps } from '../types/temperature-profile-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Relative coordinate ξ (0 = centre, 1 = surface)', min: 0, max: 1 };
const Y_AXES: ChartAxis[] = [{ title: 'T', unit: '°C' }];

export function TemperatureProfileChart({ title, request, depths, profiles }: TemperatureProfileChartProps) {
  const series = useMemo(() => toProfileSeries(depths, profiles), [depths, profiles]);
  const plotLines = useMemo(() => toBoundaryPlotLines(request), [request]);
  return <XYLineChart title={title} xAxis={X_AXIS} yAxes={Y_AXES} series={series} yPlotLines={plotLines} />;
}
