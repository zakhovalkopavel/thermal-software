import { useMemo } from 'react';
import { Typography } from '@mui/material';
import { CategoryBarChart } from '@/shared/ui/charts';
import type { ChartAxis } from '@/shared/ui/charts';
import { toPhaseCompositionBars } from '../mappers/phase-composition-bars.mapper';
import type { PhaseResultProps } from '../types/phase-result-props.type';

const Y_AXIS: ChartAxis = { title: 'Content', unit: 'wt%', min: 0 };

export function PhaseCompositionChart({ result }: PhaseResultProps) {
  const { categories, series } = useMemo(() => toPhaseCompositionBars(result), [result]);
  if (categories.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        The backend returned no phase compositions.
      </Typography>
    );
  }
  return <CategoryBarChart title="Phase compositions" categories={categories} series={series} yAxis={Y_AXIS} showLegend />;
}
