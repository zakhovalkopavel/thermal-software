import { TEMPERATURE_SWEEP } from '@/modules/materials';

export function celsiusToKelvin(celsius: number): number {
  return celsius + TEMPERATURE_SWEEP.KELVIN_OFFSET;
}
