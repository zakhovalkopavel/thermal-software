import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { PackingCpmInput } from '../types/packing-cpm-input.type';

/** Arrays shared by the CPM and Furnas requests; diameters are the d50 of each fraction. */
export function toPackingArrays(fractions: CompleteMixFraction[]): Pick<PackingCpmInput, 'massFractions' | 'densities_kgm3' | 'diameters_mm'> {
  const raw = fractions.map((fraction) => fraction.massPercent / 100);
  const sum = raw.reduce((total, value) => total + value, 0);
  const massFractions = sum > 0 ? raw.map((value) => value / sum) : raw;
  return {
    massFractions,
    densities_kgm3: fractions.map((fraction) => fraction.density_kgm3),
    diameters_mm: fractions.map((fraction) => fraction.d50_mm),
  };
}

/** Extra query-key fields so material swaps invalidate packing even when d50/ρ match. */
export function toPackingQueryKey(fractions: CompleteMixFraction[]) {
  return {
    ...toPackingArrays(fractions),
    materialIds: fractions.map((fraction) => fraction.materialId),
    sizeKeys: fractions.map((fraction) => fraction.sizeKey),
  };
}
