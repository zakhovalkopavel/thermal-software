import { useMemo } from 'react';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps } from '../../../../../components/charts';
import { formatValue } from '../../../../../components/calc';
import { toCounterFlowSeries } from '../mappers/counter-flow-series.mapper';
import type { RecuperatorChartProps } from '../types/recuperator-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Position along the recuperator', unit: 'm', min: 0 };
const Y_AXES: ChartAxis[] = [{ title: 'T', unit: 'K' }];

export function CounterFlowChart({ input, result }: RecuperatorChartProps) {
  const series = useMemo(() => toCounterFlowSeries(input, result), [input, result]);
  return (
    <XYLineChart
      title="Counter-flow temperatures"
      caption={`Only the end temperatures are returned, so each stream is drawn as a straight line. Mean ΔT = ${formatValue(result.averageDeltaT_K)} K.`}
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      yPlotLines={[{ value: result.tFlame_K, label: `Flame ${formatValue(result.tFlame_K)} K`, dashStyle: 'Dash' }]}
    />
  );
}
