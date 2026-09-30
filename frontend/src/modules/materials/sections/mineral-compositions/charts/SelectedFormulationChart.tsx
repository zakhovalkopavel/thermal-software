import { useMemo } from 'react';
import { CategoryBarChart } from '../../../../../components/charts';
import type { CategorySeries, ChartAxis } from '../../../../../components/charts';
import type { SelectedFormulationChartProps } from '../types/selected-formulation-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'Mass', unit: '%' };

export function SelectedFormulationChart({ labels, current, selected }: SelectedFormulationChartProps) {
  const categories = useMemo(() => ['Current mix', `Result #${selected.rank}`], [selected.rank]);
  const series = useMemo<CategorySeries[]>(
    () => labels.map((label, index) => ({ name: label, data: [current[index] ?? null, selected.massFractionsRoundedPercent[index] ?? null] })),
    [labels, current, selected],
  );
  return (
    <CategoryBarChart
      title="Selected formulation"
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      stacking="percent"
      horizontal
      showLegend
    />
  );
}
