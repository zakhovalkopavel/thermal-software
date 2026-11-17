import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import type { CompoundGasBounds } from '../types/compound-gas-bounds.type';
import type { TemperatureSweep } from '../types/temperature-sweep.type';

function toSweepUnit(T_K: number, unit: TemperatureSweep['unit']): number {
  const value = unit === 'C' ? kelvinToCelsius(T_K) : T_K;
  return Number(value.toFixed(2));
}

/**
 * Raise temperature inputs so the gas sweep stays at / above Tb(P).
 * Also trims the upper end when a correlation ceiling is known.
 */
export function applyGasTemperatureBounds(
  sweep: TemperatureSweep,
  bounds: Pick<CompoundGasBounds, 'Tmin_K' | 'Tmax_K'>,
): TemperatureSweep {
  const Tmin = bounds.Tmin_K != null ? toSweepUnit(bounds.Tmin_K, sweep.unit) : null;
  const Tmax = bounds.Tmax_K != null ? toSweepUnit(bounds.Tmax_K, sweep.unit) : null;
  if (Tmin == null && Tmax == null) return sweep;

  if (sweep.mode === 'single') {
    let value = sweep.value;
    if (value != null && Tmin != null && value < Tmin) value = Tmin;
    if (value != null && Tmax != null && value > Tmax) value = Tmax;
    return { ...sweep, value };
  }

  let from = sweep.from;
  let to = sweep.to;
  if (from != null && Tmin != null && from < Tmin) from = Tmin;
  if (to != null && Tmin != null && to < Tmin) to = Tmin;
  if (from != null && Tmax != null && from > Tmax) from = Tmax;
  if (to != null && Tmax != null && to > Tmax) to = Tmax;
  if (from != null && to != null && from > to) to = from;
  return { ...sweep, from, to };
}
