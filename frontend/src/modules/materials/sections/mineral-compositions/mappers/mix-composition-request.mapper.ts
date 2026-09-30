import type { MixCompositionInput } from '../../../types/mix-composition-input.type';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';

/** All complete rows, mass % → 0–1; `null` for an empty mix. */
export function toMixCompositionInput(fractions: CompleteMixFraction[]): MixCompositionInput | null {
  if (fractions.length === 0) return null;
  return { fractions: fractions.map((fraction) => ({ materialId: fraction.materialId, massFraction: fraction.massPercent / 100 })) };
}
