import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { TEMPERATURE_SWEEP } from '../constants/temperature-sweep.constants';
import type { TemperatureSweep } from '../types/temperature-sweep.type';

const GRID_EPSILON = 1e-9;
const GRID_DECIMALS = 6;

/** Temperatures of the sweep in K, both ends included. Throws a user-facing message when the sweep is invalid. */
export function toTemperatureGrid(sweep: TemperatureSweep, maxPoints: number = TEMPERATURE_SWEEP.maxPoints): number[] {
  const toKelvin = (value: number) =>
    Number((sweep.unit === 'C' ? celsiusToKelvin(value) : value).toFixed(GRID_DECIMALS));

  if (sweep.mode === 'single') {
    if (sweep.value === null) throw new Error('Enter a temperature.');
    return [toKelvin(sweep.value)];
  }

  const { from, to, step } = sweep;
  if (from === null || to === null || step === null) throw new Error('Enter from, to and step.');
  if (step <= 0) throw new Error('Step must be positive.');
  if (to < from) throw new Error('"To" must not be below "from".');

  const count = Math.floor((to - from) / step + GRID_EPSILON) + 1;
  const values = Array.from({ length: count }, (_, index) => from + index * step);
  if (to - values[values.length - 1] > GRID_EPSILON) values.push(to);
  if (values.length > maxPoints) {
    throw new Error(`The range gives ${values.length} points; the limit is ${maxPoints}. Increase the step.`);
  }
  return values.map(toKelvin);
}
