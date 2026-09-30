import { useMemo } from 'react';
import { PieChart } from '../../../../../components/charts';
import type { GasMixturePieChartProps } from '../types/gas-mixture-pie-chart-props.type';

export function GasMixturePieChart({ composition, fractionType }: GasMixturePieChartProps) {
  const data = useMemo(
    () => Object.entries(composition).map(([name, y]) => ({ name, y })),
    [composition],
  );
  return (
    <PieChart
      title="Mixture composition"
      subtitle={`${fractionType === 'mole' ? 'Mole' : 'Mass'} fractions`}
      seriesName={`${fractionType} fraction`}
      data={data}
      height={280}
    />
  );
}
