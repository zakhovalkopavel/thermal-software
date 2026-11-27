import type { MixComponentInput } from '../../../types/mix-component-input.type';

/** Mass-only rows for `/refractoriness` and `/mix/thermal`. */
export function toMixFractions(fractions: Array<{ materialId: string; massFraction: number }>): MixComponentInput[] {
  return fractions.map(({ materialId, massFraction }) => ({ materialId, massFraction }));
}
