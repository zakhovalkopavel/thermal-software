import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { PsdFractionInput } from '../types/psd-fraction-input.type';

export function toPsdFractions(fractions: CompleteMixFraction[]): PsdFractionInput[] {
  return fractions.map((fraction) => ({
    dMin_mm: fraction.dMin_mm,
    dMax_mm: fraction.dMax_mm,
    massFraction: fraction.massPercent / 100,
    isFixed: fraction.isFixed,
  }));
}
