import { useMemo } from 'react';
import { CategoryBarChart } from '@/shared/ui/charts';
import { GLASSES_UI } from '../constants/glasses-ui.constants';
import { toCompositionCompareBars } from '../mappers/composition-compare-bars.mapper';
import type { CompositionCompareChartProps } from '../types/composition-compare-chart-props.type';

export function CompositionCompareChart({ glasses, unit }: CompositionCompareChartProps) {
  const { categories, series } = useMemo(() => toCompositionCompareBars(glasses), [glasses]);
  const unitLabel = unit === 'wt' ? 'wt%' : 'mol%';
  const yAxis = useMemo(() => ({ title: 'Share', unit: unitLabel, max: 100 }), [unitLabel]);
  return (
    <CategoryBarChart
      title="Composition"
      subtitle={unitLabel}
      categories={categories}
      series={series}
      yAxis={yAxis}
      horizontal
      stacking="percent"
      showLegend
      height={GLASSES_UI.compositionChart.baseHeight + categories.length * GLASSES_UI.compositionChart.rowHeight}
    />
  );
}
