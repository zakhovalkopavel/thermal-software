import { useMemo } from 'react';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, PlotLine, XYLineChartProps, XYSeries } from '../../../../../components/charts';
import { formatValue } from '../../../../../components/calc';
import { kelvinToCelsius } from '../../../mappers/kelvin-to-celsius.mapper';
import { toWallBands } from '../mappers/wall-bands.mapper';
import { toWallProfile } from '../mappers/wall-profile.mapper';
import type { WallTemperatureChartProps } from '../types/wall-temperature-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Distance from inner surface', unit: 'mm', min: 0 };
const Y_AXES: ChartAxis[] = [{ title: 'T', unit: '°C' }];

export function WallTemperatureChart({ calculation, result, pinned }: WallTemperatureChartProps) {
  const series = useMemo<XYSeries[]>(
    () => [
      { name: 'Current', emphasis: true, showMarkers: true, data: toWallProfile(calculation.input, result) },
      ...pinned.map((variant): XYSeries => ({ name: variant.label, dashStyle: 'Dash', showMarkers: true, data: variant.points })),
    ],
    [calculation, result, pinned],
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
      caption="Straight segments between the interface temperatures returned by the backend (the internal finite-difference profile is not returned)."
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotBands={bands}
      yPlotLines={plotLines}
    />
  );
}
