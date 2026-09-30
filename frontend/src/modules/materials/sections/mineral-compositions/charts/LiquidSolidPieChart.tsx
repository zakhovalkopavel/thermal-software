import { useMemo } from 'react';
import { PieChart } from '../../../../../components/charts';
import type { PhaseResultProps } from '../types/phase-result-props.type';

export function LiquidSolidPieChart({ result }: PhaseResultProps) {
  const data = useMemo(
    () => [
      { name: 'Liquid', y: result.liquid.percent },
      { name: 'Solid', y: result.solid.percent },
    ],
    [result],
  );
  return <PieChart title={`Liquid / solid at ${result.metadata.temperature} °C`} data={data} unit="%" seriesName="Phase" />;
}
