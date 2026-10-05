import type { MixThermalInput } from '../../../types/mix-thermal-input.type';

export function toMixThermalRequest(materialId: string, temperatures_C: number[], porosity: number): MixThermalInput {
  return { fractions: [{ materialId, massFraction: 1 }], temperatures_C, porosity };
}
