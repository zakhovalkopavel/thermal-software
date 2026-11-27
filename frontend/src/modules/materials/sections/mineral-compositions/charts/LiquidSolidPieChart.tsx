import { useMemo } from 'react';
import { PieChart } from '@/shared/ui/charts';
import { PHASE_EQUILIBRIUM_UI } from '../constants/phase-equilibrium-ui.constants';
import type { PhaseResultProps } from '../types/phase-result-props.type';

export function LiquidSolidPieChart({ result }: PhaseResultProps) {
  const data = useMemo(() => {
    const { liquid, glass, crystals } = result.atTemperature;
    const crystalPercent = crystals.reduce((sum, crystal) => sum + crystal.percent, 0);
    return [
      ...(liquid.percent > 0 ? [{ name: 'Liquid (matrix)', y: liquid.percent }] : []),
      ...(glass.percent > 0 ? [{ name: PHASE_EQUILIBRIUM_UI.unreactedGlassBarLabel, y: glass.percent }] : []),
      ...(crystalPercent > 0 ? [{ name: 'Crystals', y: crystalPercent }] : []),
    ];
  }, [result]);
  return <PieChart title={`Phases at ${result.metadata.temperature} °C`} data={data} unit="%" seriesName="Phase" />;
}
