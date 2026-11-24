import { useMemo } from 'react';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { CategorySeries, ChartAxis } from '@/shared/ui/charts';
import { COMBUSTION_UI } from '../constants/combustion-ui.constants';
import type { ProductCompositionChartProps } from '../types/product-composition-chart-props.type';

const PERCENT = 100;
const CATEGORIES = [...COMBUSTION_UI.productSpecies];
const Y_AXIS: ChartAxis = { title: 'Mole fraction', unit: '%', min: 0 };

export function ProductCompositionChart({ compositions }: ProductCompositionChartProps) {
  const series = useMemo<CategorySeries[]>(
    () =>
      compositions.map(({ label, moleFractions }) => ({
        name: label,
        data: CATEGORIES.map((species) => (moleFractions[species] ?? 0) * PERCENT),
      })),
    [compositions],
  );
  return <CategoryBarChart title="Product composition" categories={CATEGORIES} series={series} yAxis={Y_AXIS} showLegend />;
}
