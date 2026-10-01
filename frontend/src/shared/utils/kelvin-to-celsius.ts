import { TEMPERATURE_SWEEP } from '@/modules/materials';

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - TEMPERATURE_SWEEP.KELVIN_OFFSET;
}
