import { celsiusToKelvin } from './celsius-to-kelvin';

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - celsiusToKelvin(0);
}
