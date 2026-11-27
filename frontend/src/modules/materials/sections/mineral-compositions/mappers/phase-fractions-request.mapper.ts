import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { PhaseEquilibriumFractionInput } from '../types/phase-equilibrium-fraction-input.type';

export function toPhaseFractions(fractions: CompleteMixFraction[]): PhaseEquilibriumFractionInput[] {
  return fractions.map((fraction) => ({
    materialId: fraction.materialId,
    d50_mm: fraction.d50_mm,
    massFraction: fraction.massPercent / 100,
  }));
}
