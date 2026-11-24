import type { ChartAxis } from './chart-axis.type';
import type { ChartCardCommonProps } from './chart-card-common-props.type';
import type { PlotBand } from './plot-band.type';
import type { PlotLine } from './plot-line.type';
import type { XYSeries } from './xy-series.type';

export type XYLineChartProps = ChartCardCommonProps & {
  xAxis: ChartAxis & { tooltipExtra?: (x: number) => string };
  yAxes: ChartAxis[];
  series: XYSeries[];
  xPlotLines?: PlotLine[];
  yPlotLines?: PlotLine[];
  xPlotBands?: PlotBand[];
  markers?: Array<{ name: string; points: [number, number][]; color?: string; yAxis?: number }>;
  tooltipPointExtra?: (y: number, seriesName: string) => string;
};
