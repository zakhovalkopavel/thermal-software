import type { BlendOptimizationInput } from '../types/blend-optimization-input.type';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';

export function toBlendOptimizationInput(
  fractions: CompleteMixFraction[],
  options: BlendOptimizationInput['options'],
): BlendOptimizationInput {
  return {
    fractions: fractions.map((fraction) => ({
      materialId: fraction.materialId,
      dMin_mm: fraction.dMin_mm,
      dMax_mm: fraction.dMax_mm,
      massFraction: fraction.massPercent / 100,
      isFixed: fraction.isFixed,
      density_kgm3: fraction.density_kgm3,
    })),
    options,
  };
}
