import { TEMPERATURE_SWEEP } from '../../materials';

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - TEMPERATURE_SWEEP.KELVIN_OFFSET;
}
