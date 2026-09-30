import type { ReactNode } from 'react';
import type Highcharts from 'highcharts';

export type ChartCardCommonProps = {
  title: string;
  subtitle?: ReactNode;
  caption?: ReactNode;
  actions?: ReactNode;
  height?: number;
  optionsOverride?: Highcharts.Options;
};
