import { CompoundValue } from '../../interfaces/compound-value.interface';
import { RefKey } from '../../enum/ref-key.enum';
import { Nasa7EquationMethod } from '../equation-methods/nasa7-equation-method';
import { Nasa9EquationMethod } from '../equation-methods/nasa9-equation-method';
import { compoundNasa7 } from './compound-nasa7.util';
import { compoundNasa9 } from './compound-nasa9.util';
import { NasaMethod } from './nasa-method.interface';
import { NasaThermo } from './nasa-thermo.interface';

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
