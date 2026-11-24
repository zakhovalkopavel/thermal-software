import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps, XYSeries } from '@/shared/ui/charts';
import { toBoundaryPlotLines } from '../mappers/boundary-plot-lines.mapper';
import type { AverageTemperatureChartProps } from '../types/average-temperature-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Time τ', unit: 's', min: 0 };
const Y_AXES: ChartAxis[] = [{ title: 'Average T', unit: '°C' }];

export function AverageTemperatureChart({ request, points }: AverageTemperatureChartProps) {
  const series = useMemo<XYSeries[]>(
    () => [
      {
        name: 'Volume-average T',
        unit: '°C',
        emphasis: true,
        showMarkers: true,
        data: points.flatMap(({ tau, temperature }): [number, number][] => (temperature === undefined ? [] : [[tau, temperature]])),
      },
    ],
    [points],
  );
  const plotLines = useMemo(() => toBoundaryPlotLines(request), [request]);
  return <XYLineChart title="Average temperature vs time" xAxis={X_AXIS} yAxes={Y_AXES} series={series} yPlotLines={plotLines} />;
}
