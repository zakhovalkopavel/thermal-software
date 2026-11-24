import { STANDARD_CONDITIONS } from '../../constants/standard-conditions.constants';

/** T [K] from T [°C] */
export function celsiusToKelvin(T_C: number): number {
  return T_C + STANDARD_CONDITIONS.ZERO_CELSIUS_K;
}
