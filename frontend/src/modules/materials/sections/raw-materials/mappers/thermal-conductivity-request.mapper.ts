import type { OxideComposition } from '../../../types/oxide-composition.type';
import type { ThermalConductivityInput } from '../../../types/thermal-conductivity-input.type';

export function toThermalConductivityRequest(
  acceptedOxidesNormalized: OxideComposition,
  temperature_C: number,
  porosity: number,
): ThermalConductivityInput {
  return { composition: acceptedOxidesNormalized, temperature: temperature_C, porosity };
}
