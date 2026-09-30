import { useMemo } from 'react';
import { formatValue } from '../../../../../components/calc';
import { PieChart } from '../../../../../components/charts';
import { toBulkCompositionSlices } from '../mappers/bulk-composition-slices.mapper';
import type { BulkCompositionPieProps } from '../types/bulk-composition-pie-props.type';

export function BulkCompositionPieChart({ result }: BulkCompositionPieProps) {
  const data = useMemo(() => toBulkCompositionSlices(result, result.acceptedOxides_wt as Record<string, number>), [result]);
  return (
    <PieChart
      title="Mix composition (fired basis)"
      subtitle={`wt% of fired mass · loss on ignition ${formatValue(result.lossOnIgnition_wt)} wt% of raw mix`}
      caption="Hatched: not used by the chemical analyses"
      data={data}
      unit="wt%"
      seriesName="Fired composition"
      donut
    />
  );
}
