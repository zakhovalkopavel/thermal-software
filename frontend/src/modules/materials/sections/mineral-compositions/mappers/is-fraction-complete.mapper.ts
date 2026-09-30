import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { MixFraction } from '../types/mix-fraction.type';

export function isFractionComplete(fraction: MixFraction): fraction is CompleteMixFraction {
  return (
    fraction.materialId !== null &&
    fraction.dMin_mm !== null &&
    fraction.dMax_mm !== null &&
    fraction.d50_mm !== null &&
    fraction.dMax_mm > fraction.dMin_mm &&
    fraction.massPercent !== null &&
    fraction.massPercent > 0 &&
    fraction.density_kgm3 !== null &&
    fraction.density_kgm3 > 0
  );
}
