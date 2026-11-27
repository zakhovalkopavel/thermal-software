import type { CategorySeries } from '@/shared/ui/charts';
import { PHASE_EQUILIBRIUM_UI } from '../constants/phase-equilibrium-ui.constants';
import type { PhaseEquilibriumResult } from '../types/phase-equilibrium-result.type';

/** Amounts of the phases at temperature: liquid, unreacted amorphous cores (when present) and every crystal phase. */
export function toPhaseCompositionBars(result: PhaseEquilibriumResult): { categories: string[]; series: CategorySeries[] } {
  const { liquid, glass, crystals } = result.atTemperature;
  const entries = [
    { name: 'Liquid (matrix)', percent: liquid.percent },
    ...(glass.percent > 0 ? [{ name: PHASE_EQUILIBRIUM_UI.unreactedGlassBarLabel, percent: glass.percent }] : []),
    ...crystals.map((crystal) => ({ name: crystal.phase, percent: crystal.percent })),
  ];
  return {
    categories: entries.map((entry) => entry.name),
    series: [{ name: 'Amount', data: entries.map((entry) => entry.percent) }],
  };
}
