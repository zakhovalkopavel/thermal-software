import { useMemo } from 'react';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { ChartAxis } from '@/shared/ui/charts';
import { REFRACTORIES_UI } from '../constants/refractories-ui.constants';
import { toRefractoryRanking } from '../mappers/refractory-ranking.mapper';
import type { RefractoryChartProps } from '../types/refractory-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'λ', unit: 'W/(m·K)', min: 0 };

export function RefractoryRankingChart({ products, byMaterial }: RefractoryChartProps) {
  const { categories, series } = useMemo(() => toRefractoryRanking(byMaterial, products), [byMaterial, products]);
  return (
    <CategoryBarChart
      title="Insulating ability ranking"
      subtitle="Lower λ = better insulator"
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      horizontal
      height={REFRACTORIES_UI.rankingChart.baseHeight + categories.length * REFRACTORIES_UI.rankingChart.rowHeight}
    />
  );
}
