import { useMemo } from 'react';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps } from '../../../../../components/charts';
import { toNuReSeries } from '../mappers/nu-re-series.mapper';
import { toReValidityBand } from '../mappers/re-validity-band.mapper';
import type { NusseltReynoldsChartProps } from '../types/nusselt-reynolds-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Re', type: 'logarithmic' };
const Y_AXES: ChartAxis[] = [{ title: 'Nu', type: 'logarithmic' }];

export function NusseltReynoldsChart({ points, correlation }: NusseltReynoldsChartProps) {
  const series = useMemo(() => toNuReSeries(points), [points]);
  const bands = useMemo(
    () => toReValidityBand(correlation, series.flatMap((item) => item.data.map(([re]) => re))),
    [correlation, series],
  );

  return (
    <XYLineChart
      title="Nu vs Re"
      caption="One series per correlation chosen by the backend at each velocity; the band is the validity range of the selected correlation."
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotBands={bands}
    />
  );
}
