import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { PackingCpmInput } from '../types/packing-cpm-input.type';

/** Arrays shared by the CPM and Furnas requests; diameters are the d50 of each fraction. */
export function toPackingArrays(fractions: CompleteMixFraction[]): Pick<PackingCpmInput, 'massFractions' | 'densities_kgm3' | 'diameters_mm'> {
  return {
    massFractions: fractions.map((fraction) => fraction.massPercent / 100),
    densities_kgm3: fractions.map((fraction) => fraction.density_kgm3),
    diameters_mm: fractions.map((fraction) => fraction.d50_mm),
  };
}
