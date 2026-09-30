import { useMemo } from 'react';
import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import type { MineralPhasesChartProps } from '../types/mineral-phases-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'Amount', unit: '%', min: 0 };

export function MineralPhasesChart({ phases }: MineralPhasesChartProps) {
  const { categories, series } = useMemo(
    () => ({
      categories: phases.map((phase) => `${phase.phase} (${phase.formula})`),
      series: [{ name: 'Amount', data: phases.map((phase) => phase.percent) }],
    }),
    [phases],
  );
  return (
    <CategoryBarChart
      title="Mineral phases"
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      horizontal
      tooltipExtra={(index) => `${phases[index]?.description ?? ''}<br/>Melting point ${phases[index]?.meltingPoint ?? '—'} °C`}
    />
  );
}
