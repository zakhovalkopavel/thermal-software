import type { CategorySeries } from '@/shared/ui/charts';
import type { PhaseEquilibriumResult } from '../types/phase-equilibrium-result.type';

export function toPhaseCompositionBars(result: PhaseEquilibriumResult): { categories: string[]; series: CategorySeries[] } {
  const categories = [...new Set([...Object.keys(result.liquid.composition), ...Object.keys(result.solid.composition)])];
  return {
    categories,
    series: [
      { name: 'Liquid', data: categories.map((oxide) => result.liquid.composition[oxide] ?? null) },
      { name: 'Solid', data: categories.map((oxide) => result.solid.composition[oxide] ?? null) },
    ],
  };
}
