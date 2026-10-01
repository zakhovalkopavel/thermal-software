import { useMemo } from 'react';
import { formatValue } from '@/shared/ui/calc';
import { PieChart } from '@/shared/ui/charts';
import type { PieSlice } from '@/shared/ui/charts';
import type { WallResultChartProps } from '../types/wall-result-chart-props.type';

export function InnerHtcPieChart({ result }: WallResultChartProps) {
  const data = useMemo<PieSlice[]>(
    () => [
      { name: 'Convection', y: result.alphaInner.convection_Wm2K },
      { name: 'Radiation', y: result.alphaInner.radiation_Wm2K },
    ],
    [result],
  );
  return (
    <PieChart
      title="Inner heat-transfer coefficient"
      subtitle={`α total ${formatValue(result.alphaInner.total_Wm2K)} W/(m²·K)`}
      data={data}
      unit="W/(m²·K)"
      seriesName="α"
      donut
    />
  );
}
