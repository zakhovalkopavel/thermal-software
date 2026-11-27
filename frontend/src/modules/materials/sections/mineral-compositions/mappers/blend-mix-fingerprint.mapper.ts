import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';

/** Stable signature of the mix rows the blend optimiser consumes. */
export function toBlendMixFingerprint(fractions: CompleteMixFraction[]): string {
  return fractions
    .map(
      (fraction) =>
        [
          fraction.id,
          fraction.materialId,
          fraction.massPercent,
          fraction.dMin_mm,
          fraction.dMax_mm,
          fraction.density_kgm3,
          fraction.isFixed ? 1 : 0,
        ].join(':'),
    )
    .join('|');
}
