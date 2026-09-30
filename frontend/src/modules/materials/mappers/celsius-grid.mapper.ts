import { TEMPERATURE_SWEEP } from '../constants/temperature-sweep.constants';
import { toTemperatureGrid } from './temperature-grid.mapper';

const GRID_DECIMALS = 6;

/** °C grid from / to / step, both ends included. Throws a user-facing message when invalid. */
export function toCelsiusGrid(from: number | null, to: number | null, step: number | null, maxPoints: number): number[] {
  return toTemperatureGrid({ mode: 'range', unit: 'C', value: null, from, to, step }, maxPoints).map((T_K) =>
    Number((T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET).toFixed(GRID_DECIMALS)),
  );
}
