import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { toTemperatureGrid } from './temperature-grid.mapper';

const GRID_DECIMALS = 6;

/** °C grid from / to / step, both ends included. Throws a user-facing message when invalid. */
export function toCelsiusGrid(from: number | null, to: number | null, step: number | null, maxPoints: number): number[] {
  return toTemperatureGrid({ mode: 'range', unit: 'C', value: null, from, to, step }, maxPoints).map((T_K) =>
    Number(kelvinToCelsius(T_K).toFixed(GRID_DECIMALS)),
  );
}
