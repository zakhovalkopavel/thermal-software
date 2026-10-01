import { useMemo } from 'react';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { CategorySeries, ChartAxis } from '@/shared/ui/charts';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import type { PackingModel } from '../types/packing-model.type';
import type { PackingModelsChartProps } from '../types/packing-models-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'Volume fraction', min: 0, max: 1 };

export function PackingModelsChart({ results }: PackingModelsChartProps) {
  const { categories, series } = useMemo(() => {
    const models = (Object.keys(MIX_OPTION_LABELS.packingModel) as PackingModel[]).filter((model) => results[model]);
    const data: CategorySeries[] = [
      { name: 'Packing fraction φ', data: models.map((model) => results[model]?.packingFraction_phi ?? null) },
      { name: 'Green porosity', data: models.map((model) => results[model]?.porosity_initial ?? null) },
    ];
    return { categories: models.map((model) => MIX_OPTION_LABELS.packingModel[model]), series: data };
  }, [results]);

  return <CategoryBarChart title="Packing models" categories={categories} series={series} yAxis={Y_AXIS} showLegend />;
}
