import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { toBedProfileSeries } from '../mappers/bed-profile-series.mapper';
import type { BedProfileChartProps } from '../types/bed-profile-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Height above grate z', unit: 'm' };
const Y_AXES: ChartAxis[] = [
  { title: 'T', unit: 'K' },
  { title: 'Mole fraction', unit: '%', min: 0, opposite: true },
];

export function BedProfileChart({ layers }: BedProfileChartProps) {
  const series = useMemo(() => toBedProfileSeries(layers), [layers]);
  return <XYLineChart title="Bed profile" caption="Values at layer centres" xAxis={X_AXIS} yAxes={Y_AXES} series={series} />;
}
