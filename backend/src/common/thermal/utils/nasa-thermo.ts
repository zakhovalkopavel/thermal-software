import { CompoundValue } from '../interfaces/compound-value.interface';
import { RefKey } from '../enum/ref-key.enum';
import { Nasa7EquationMethod } from './nasa7-equation-method';
import { Nasa9EquationMethod } from './nasa9-equation-method';
import { compoundNasa7, compoundNasa9 } from './nasa-database';

/** Cp, H, S, G of a compound from one NASA dataset */
export interface NasaThermo {
  /** RefKey.NASA9 or RefKey.NASA7 */
  ref: RefKey;
  /** Validity range of the dataset [K] */
  Tmin: number;
  Tmax: number;
  /** Cp [J/(mol·K)], T clamped to [Tmin, Tmax] */
  cp(T: number): number;
  /** Formation-referenced H [J/mol]; outside [Tmin, Tmax] extrapolated with the boundary Cp */
  enthalpy(T: number): number;
  /** Absolute S [J/(mol·K)]; outside [Tmin, Tmax] extrapolated with the boundary Cp */
  entropy(T: number): number;
  /** G = H − T·S [J/mol] */
  gibbsEnergy(T: number): number;
}

interface NasaMethod<V> {
  calculate(T: number, vars: V, min: number, max: number): number;
  enthalpy(T: number, vars: V): number;
  entropy(T: number, vars: V): number;
  gibbsEnergy(T: number, vars: V): number;
}

const nasa7Method = new Nasa7EquationMethod();
const nasa9Method = new Nasa9EquationMethod();

function nasaThermo<V>(ref: RefKey, method: NasaMethod<V>, vars: V, Tmin: number, Tmax: number): NasaThermo {
  const clamp = (T: number) => Math.min(Math.max(T, Tmin), Tmax);
  const cp = (T: number) => method.calculate(T, vars, Tmin, Tmax);
  const enthalpy = (T: number) => {
    const Tb = clamp(T);
    return method.enthalpy(Tb, vars) + cp(Tb) * (T - Tb);
  };
  const entropy = (T: number) => {
    const Tb = clamp(T);
    return method.entropy(Tb, vars) + cp(Tb) * Math.log(T / Tb);
  };
  const gibbsEnergy = (T: number) =>
    T === clamp(T) ? method.gibbsEnergy(T, vars) : enthalpy(T) - T * entropy(T);
  return { ref, Tmin, Tmax, cp, enthalpy, entropy, gibbsEnergy };
}

/**
 * NASA thermodynamics of a compound: NASA-9 (`nasa9Key`) by default, NASA-7 (`nasa7Key`)
 * when there is no NASA-9 dataset; undefined when the compound has neither.
 */
export function compoundNasaThermo(compound: CompoundValue): NasaThermo | undefined {
  const n9 = compoundNasa9(compound);
  if (n9) {
    const { ranges } = n9.nasa9;
    return nasaThermo(RefKey.NASA9, nasa9Method, n9.nasa9, ranges[0].Tmin, ranges[ranges.length - 1].Tmax);
  }
  const n7 = compoundNasa7(compound);
  return n7 ? nasaThermo(RefKey.NASA7, nasa7Method, n7.nasa7, n7.Tmin, n7.Tmax) : undefined;
}
