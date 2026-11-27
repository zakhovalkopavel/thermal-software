import { formatValue } from '@/shared/ui/calc';
import type { PhaseEquilibriumViscosity } from '../types/phase-equilibrium-viscosity.type';

/** One-line melt viscosity for the phase-equilibrium summary. */
export function formatMeltViscosity(viscosity: PhaseEquilibriumViscosity | null | undefined, empty = '—'): string {
  if (!viscosity) return empty;
  return `${formatValue(viscosity.viscosity_Pas)} Pa·s (log₁₀ η = ${formatValue(viscosity.logViscosity)}, ${viscosity.model}, ${viscosity.confidence})`;
}
