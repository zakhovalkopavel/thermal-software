import { useMemo } from 'react';
import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { useMix } from '../hooks/useMix';
import { toMixStructure } from '../mappers/mix-structure.mapper';

const Y_AXIS: ChartAxis = { title: 'Mass', unit: '%', min: 0 };

export function MixStructureChart() {
  const { completeFractions, components } = useMix();
  const { categories, series } = useMemo(() => toMixStructure(completeFractions, components), [completeFractions, components]);
  if (categories.length === 0) return null;
  return (
    <CategoryBarChart
      title="Mix structure"
      subtitle="Size fractions, coarse → fine"
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      stacking="normal"
      showLegend
      height={MINERAL_COMPOSITIONS_UI.structureChartHeight}
    />
  );
}
