import { useMemo } from 'react';
import { formatValue } from '@/shared/ui/calc';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { ChartAxis } from '@/shared/ui/charts';
import type { ParticipationChartProps } from '../types/participation-chart-props.type';

const Y_AXIS: ChartAxis = { title: 'Participation share', unit: '%', min: 0 };

export function ParticipationChart({ labels, result }: ParticipationChartProps) {
  const series = useMemo(
    () => [
      {
        name: 'Participation',
        data: labels.map((_, index) => {
          const item = result.normalizedParticipation.find((entry) => entry.fractionIndex === index);
          return item ? item.normalizedParticipation * 100 : null;
        }),
      },
    ],
    [labels, result],
  );
  return (
    <CategoryBarChart
      title="Reaction participation"
      subtitle={`Total participation ${formatValue(result.totalParticipation)}`}
      categories={labels}
      series={series}
      yAxis={Y_AXIS}
    />
  );
}
