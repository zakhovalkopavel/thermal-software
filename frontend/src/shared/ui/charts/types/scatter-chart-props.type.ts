import type { ChartAxis } from './chart-axis.type';
import type { ChartCardCommonProps } from './chart-card-common-props.type';
import type { ScatterSeries } from './scatter-series.type';

export type ScatterChartProps = ChartCardCommonProps & {
  xAxis: ChartAxis;
  yAxis: ChartAxis;
  series: ScatterSeries[];
  bubble?: boolean;
  zLabel?: string;
  selectedId?: string | null;
  highlightedIds?: string[];
  onPointClick?: (id: string) => void;
};
