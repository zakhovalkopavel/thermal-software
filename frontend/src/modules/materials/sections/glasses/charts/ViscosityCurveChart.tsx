import { useMemo } from 'react';
import { formatPowerOfTen, formatValue } from '../../../../../components/calc';
import { XYLineChart, chartFormat } from '../../../../../components/charts';
import type { ChartAxis, PlotLine, XYLineChartProps } from '../../../../../components/charts';
import { TEMPERATURE_SWEEP } from '../../../constants/temperature-sweep.constants';
import { GLASSES_UI } from '../constants/glasses-ui.constants';
import { toFixedPointMarkers } from '../mappers/fixed-point-markers.mapper';
import { toViscosityLevelPlotLines } from '../mappers/viscosity-level-plot-lines.mapper';
import { toViscositySeries } from '../mappers/viscosity-series.mapper';
import type { ViscosityCurveChartProps } from '../types/viscosity-curve-chart-props.type';

const Y_AXES: ChartAxis[] = [
  { title: 'η', unit: 'Pa·s', type: 'logarithmic', min: GLASSES_UI.viscosityAxis.min, max: GLASSES_UI.viscosityAxis.max },
];
const LOG_DIGITS = 3;
const tooltipPointExtra = (y: number) => `(log₁₀η = ${formatValue(Math.log10(y), LOG_DIGITS)})`;

export function ViscosityCurveChart({
  curves,
  xMin,
  xMax,
  userFixedPoints,
  atTemperature,
  atViscosity,
  subtitle,
}: ViscosityCurveChartProps) {
  const xAxis = useMemo<XYLineChartProps['xAxis']>(
    () => ({
      title: 'T',
      unit: '°C',
      min: xMin,
      max: xMax,
      tooltipExtra: (x) => chartFormat.value(x + TEMPERATURE_SWEEP.KELVIN_OFFSET, 'K'),
    }),
    [xMin, xMax],
  );
  const series = useMemo(() => toViscositySeries(curves), [curves]);

  const yPlotLines = useMemo<PlotLine[]>(
    () => [
      ...toViscosityLevelPlotLines(),
      ...(atViscosity
        ? [{ value: Math.pow(10, atViscosity.targetLogEta), label: `Target ${formatPowerOfTen(atViscosity.targetLogEta)}`, dashStyle: 'Solid' as const }]
        : []),
    ],
    [atViscosity],
  );
  const xPlotLines = useMemo<PlotLine[]>(() => {
    const task = atTemperature ?? atViscosity;
    return task ? [{ value: task.temperature_C, label: `${formatValue(task.temperature_C)} °C`, dashStyle: 'Solid' }] : [];
  }, [atTemperature, atViscosity]);

  const markers = useMemo<NonNullable<XYLineChartProps['markers']>>(() => {
    const result: NonNullable<XYLineChartProps['markers']> = [];
    const fixed = toFixedPointMarkers(userFixedPoints);
    if (fixed.length > 0) result.push({ name: 'Fixed points (your glass)', points: fixed });
    if (atTemperature) {
      result.push({ name: 'At T', points: [[atTemperature.temperature_C, Math.pow(10, atTemperature.logViscosity)]] });
    }
    if (atViscosity) {
      result.push({ name: 'T at η', points: [[atViscosity.temperature_C, Math.pow(10, atViscosity.targetLogEta)]] });
    }
    return result;
  }, [userFixedPoints, atTemperature, atViscosity]);

  return (
    <XYLineChart
      title="Viscosity η(T)"
      subtitle={subtitle ?? 'Logarithmic viscosity axis'}
      xAxis={xAxis}
      yAxes={Y_AXES}
      series={series}
      yPlotLines={yPlotLines}
      xPlotLines={xPlotLines}
      markers={markers}
      tooltipPointExtra={tooltipPointExtra}
      height={GLASSES_UI.viscosityChartHeight}
    />
  );
}
