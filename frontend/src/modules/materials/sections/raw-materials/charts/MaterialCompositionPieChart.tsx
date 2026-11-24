import { useMemo } from 'react';
import { PieChart } from '@/shared/ui/charts';
import type { MaterialCompositionProps } from '../types/material-composition-props.type';

export function MaterialCompositionPieChart({ composition }: MaterialCompositionProps) {
  const data = useMemo(
    () =>
      Object.entries(composition)
        .filter(([, value]) => value > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name, y]) => ({ name, y })),
    [composition],
  );
  return <PieChart title="Stored composition" data={data} unit="wt%" seriesName="Composition" />;
}
