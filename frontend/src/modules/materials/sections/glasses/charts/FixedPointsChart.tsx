import { useMemo } from 'react';
import { formatValue } from '@/shared/ui/calc';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { ChartAxis } from '@/shared/ui/charts';
import { toFixedPointsBars } from '../mappers/fixed-points-bars.mapper';
import type { GlassCurvesProps } from '../types/glass-curves-props.type';

const Y_AXIS: ChartAxis = { title: 'T', unit: '°C' };

export function FixedPointsChart({ curves }: GlassCurvesProps) {
  const { categories, series, spans, omitted } = useMemo(() => toFixedPointsBars(curves), [curves]);
  const tooltipExtra = useMemo(
    () => (_index: number, seriesName: string) => {
      const span = spans[seriesName];
      return span
        ? `Working range: ${formatValue(span.workingToSoftening_C)} °C<br/>Melting → strain: ${formatValue(span.meltingToStrain_C)} °C`
        : '';
    },
    [spans],
  );

  return (
    <CategoryBarChart
      title="Fixed points"
      caption={omitted.length > 0 ? `No fixed points from the model (e.g. Hetherington): ${omitted.join(', ')}` : undefined}
      categories={categories}
      series={series}
      yAxis={Y_AXIS}
      tooltipExtra={tooltipExtra}
      showLegend
    />
  );
}
