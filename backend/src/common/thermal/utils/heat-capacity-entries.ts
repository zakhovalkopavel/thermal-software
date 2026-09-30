import { CompoundValue } from '../interfaces/compound-value.interface';
import { EquationValue } from '../interfaces/equation-value.interface';
import { EquationTypeDto } from '../dto/equation-type.dto';
import { RefKey } from '../enum/ref-key.enum';
import { compoundNasa7, compoundNasa9 } from './nasa-database';

export interface HeatCapacityEntries {
  /** Index of the default approximation in `values` */
  def: number;
  values: EquationValue[];
}

const cache = new WeakMap<CompoundValue, HeatCapacityEntries>();

/**
 * All Cp approximations of a compound: the tabulated `heatCapacity.values`, then NASA-9 and
 * NASA-7 read from the NASA databases by `nasa9Key` / `nasa7Key`. Indices of `heatCapacity.values`
 * are kept. Default: NASA-9, else NASA-7, else `heatCapacity.def`.
 */
export function heatCapacityEntries(compound: CompoundValue): HeatCapacityEntries {
  const cached = cache.get(compound);
  if (cached) return cached;

  const tabulated = compound.heatCapacity?.values ?? [];
  const values: EquationValue[] = [...tabulated];
  const nasa9 = compoundNasa9(compound)?.nasa9;
  if (nasa9) {
    values.push({
      type: EquationTypeDto.nasa9, ref: RefKey.NASA9, vars: nasa9,
      min: nasa9.ranges[0].Tmin, max: nasa9.ranges[nasa9.ranges.length - 1].Tmax,
    });
  }
  const nasa7 = compoundNasa7(compound);
  if (nasa7) {
    values.push({ type: EquationTypeDto.nasa7, ref: RefKey.NASA7, vars: nasa7.nasa7, min: nasa7.Tmin, max: nasa7.Tmax });
  }
  if (!values.length) throw new Error(`No heat capacity data for ${compound.chemicalFormula}`);

  const hasNasa = values.length > tabulated.length;
  const entries = { def: hasNasa ? tabulated.length : (compound.heatCapacity?.def ?? 0), values };
  cache.set(compound, entries);
  return entries;
}
