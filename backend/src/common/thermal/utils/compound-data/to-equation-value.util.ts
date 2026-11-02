import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { CompoundDataEquationValue } from './interfaces/equation/compound-data-equation-value.interface';
import { CompoundDataRef } from './interfaces/property/compound-data-ref.type';

const REF_KEYS = new Set<string>(Object.values(RefKey));
const EQUATION_TYPES = new Set<string>(Object.values(EquationTypeDto));

function refKey(ref: CompoundDataRef | string): RefKey {
  const key = Array.isArray(ref) ? ref[0] : ref;
  if (!REF_KEYS.has(key)) throw new Error(`Compound-data ref "${key}" is not a RefKey`);
  return key as RefKey;
}

/**
 * Dataset row → backend `EquationValue`.
 * `ref` is the source-row tuple; the backend keeps `ref[0]`.
 * A missing temperature range (`null`, VDI gas tables) becomes ±Infinity, so the equation is not clamped.
 */
export function toEquationValue(row: CompoundDataEquationValue): EquationValue {
  if (!EQUATION_TYPES.has(row.type)) {
    throw new Error(`Compound-data equation type "${row.type}" is not implemented`);
  }
  const value: EquationValue = {
    type: row.type as EquationTypeDto,
    ref: refKey(row.ref),
    vars: row.vars,
    min: row.min ?? Number.NEGATIVE_INFINITY,
    max: row.max ?? Number.POSITIVE_INFINITY,
  };
  if (row.k !== undefined) value.k = row.k;
  return value;
}
