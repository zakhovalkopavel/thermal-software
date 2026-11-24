import { useMemo } from 'react';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { CategorySeries, ChartAxis, PlotLine } from '@/shared/ui/charts';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import type { WaterRangeChartProps } from '../types/water-range-chart-props.type';

const CATEGORIES = ['Min', 'Typical', 'Max'];
const Y_AXIS: ChartAxis = { title: 'Water', unit: '%', min: 0 };

export function WaterRangeChart({ range, demand_pct, workability }: WaterRangeChartProps) {
  const series = useMemo<CategorySeries[]>(() => [{ name: 'Water demand range', data: [range.min, range.typical, range.max] }], [range]);
  const plotLines: PlotLine[] =
    demand_pct !== undefined ? [{ value: demand_pct, label: `${MIX_OPTION_LABELS.workability[workability]}: ${demand_pct} %` }] : [];

  return <CategoryBarChart title="Water demand range" categories={CATEGORIES} series={series} yAxis={Y_AXIS} yPlotLines={plotLines} />;
}
