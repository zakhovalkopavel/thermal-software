import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import { GEOMETRY_DIMENSIONS } from '../constants/geometry-dimensions.constants';
import type { FlowGeometryInfo } from '../types/flow-geometry-info.type';

export function toDimensionFieldSpecs(geometry: FlowGeometryInfo): NumberFieldSpec<string>[] {
  const spec = (key: string, required: boolean): NumberFieldSpec<string> => {
    const known = GEOMETRY_DIMENSIONS[key] ?? { label: key };
    const helperText = required ? known.helperText : ['Optional', known.helperText].filter(Boolean).join(' — ');
    return { key, label: known.label, unit: known.unit, min: known.min, max: known.max, helperText, required };
  };
  return [...geometry.requiredDims.map((key) => spec(key, true)), ...(geometry.optionalDims ?? []).map((key) => spec(key, false))];
}
