import { EvaluationResult } from '../../interfaces/equation-validity.interface';
import { buildTemperatureValidity } from '../equation-validity.util';
import { NasaThermo } from './nasa-thermo.interface';

export type NasaThermoProperty = 'cp' | 'enthalpy' | 'entropy' | 'gibbsEnergy';

/**
 * Evaluate a NASA thermo property with boundary metadata.
 * Cp outside range is clamped; H/S/G outside range are extrapolated with boundary Cp.
 */
export function evaluateNasaThermo(
  nasa: NasaThermo,
  property: NasaThermoProperty,
  T: number,
): EvaluationResult {
  const inRange = T >= nasa.Tmin && T <= nasa.Tmax;
  const value = nasa[property](T);

  if (property === 'cp') {
    return {
      value,
      validity: buildTemperatureValidity(T, nasa.Tmin, nasa.Tmax),
    };
  }

  // H / S / G: extrapolate-with-boundary-Cp when OOR
  const action = inRange ? 'none' as const : 'extrapolated' as const;
  const effectiveT = Math.min(Math.max(T, nasa.Tmin), nasa.Tmax);
  return {
    value,
    validity: buildTemperatureValidity(T, nasa.Tmin, nasa.Tmax, {
      action,
      message: inRange
        ? undefined
        : `T=${T} K is outside [${nasa.Tmin}, ${nasa.Tmax}] K; ${property} extrapolated with boundary Cp at ${effectiveT} K.`,
    }),
  };
}
