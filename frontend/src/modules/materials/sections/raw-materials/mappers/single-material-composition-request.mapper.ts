import type { MixCompositionInput } from '../../../types/mix-composition-input.type';

export function toSingleMaterialCompositionRequest(materialId: string): MixCompositionInput {
  return { fractions: [{ materialId, massFraction: 1 }] };
}
