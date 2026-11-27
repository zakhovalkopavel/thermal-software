import { formatValue } from '@/shared/ui/calc';
import { PHASE_EQUILIBRIUM_UI } from '../constants/phase-equilibrium-ui.constants';
import type { PhaseEquilibriumGlassPoints } from '../types/phase-equilibrium-glass-points.type';

/** One-line display of strain / Tg / softening / working points. */
export function formatGlassPoints(points: PhaseEquilibriumGlassPoints | null | undefined): string {
  if (!points) return PHASE_EQUILIBRIUM_UI.empty;
  return (
    `strain ${formatValue(points.strainPoint_C)} °C · Tg ${formatValue(points.glassTransition_C)} °C · ` +
    `softening ${formatValue(points.softeningPoint_C)} °C · working ${formatValue(points.workingPoint_C)} °C`
  );
}
