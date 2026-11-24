import type { ChartAxis } from './chart-axis.type';
import type { ChartCardCommonProps } from './chart-card-common-props.type';
import type { CategorySeries } from './category-series.type';
import type { PlotLine } from './plot-line.type';

export type CategoryBarChartProps = ChartCardCommonProps & {
  categories: string[];
  series: CategorySeries[];
  yAxis: ChartAxis;
  horizontal?: boolean;
  stacking?: 'normal' | 'percent';
  yPlotLines?: PlotLine[];
  showLegend?: boolean;
  tooltipExtra?: (categoryIndex: number, seriesName: string, y: number) => string;
};
