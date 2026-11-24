import type { ChartCardCommonProps } from './chart-card-common-props.type';
import type { PieSlice } from './pie-slice.type';

export type PieChartProps = ChartCardCommonProps & {
  data: PieSlice[];
  unit?: string;
  seriesName?: string;
  donut?: boolean;
};
