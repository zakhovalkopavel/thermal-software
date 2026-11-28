import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, PlotLine, XYLineChartProps, XYSeries } from '@/shared/ui/charts';
import { formatValue } from '@/shared/ui/calc';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { toWallBands } from '../mappers/wall-bands.mapper';
import { toWallProfile } from '../mappers/wall-profile.mapper';
import type { WallTemperatureChartProps } from '../types/wall-temperature-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Distance from inner surface', unit: 'mm', min: 0 };
const Y_AXES: ChartAxis[] = [{ title: 'T', unit: '°C' }];

export function WallTemperatureChart({ calculation, result, pinned }: WallTemperatureChartProps) {
  const series = useMemo<XYSeries[]>(
    () => [
      { name: 'Current', emphasis: true, data: toWallProfile(result) },
      ...pinned.map((variant): XYSeries => ({ name: variant.label, dashStyle: 'Dash', data: variant.points })),
    ],
    [result, pinned],
  );
  const bands = useMemo(() => toWallBands(calculation), [calculation]);
  const gasC = kelvinToCelsius(result.tGasAverage_K);
  const ambientC = kelvinToCelsius(calculation.input.tAmbient_K);
  const plotLines: PlotLine[] = [
    { value: gasC, label: `Gas (average) ${formatValue(gasC)} °C` },
    { value: ambientC, label: `Ambient ${formatValue(ambientC)} °C` },
  ];

  return (
    <XYLineChart
      title="Temperature through the wall"
      caption="Finite-difference profile with material conductivity λ evaluated at the local temperature in each step."
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotBands={bands}
      yPlotLines={plotLines}
    />
  );
}
