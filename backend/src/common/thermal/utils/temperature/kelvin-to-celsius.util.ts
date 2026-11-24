import { celsiusToKelvin } from './celsius-to-kelvin.util';

/** T [°C] from T [K] */
export function kelvinToCelsius(T_K: number): number {
  return T_K - celsiusToKelvin(0);
}
