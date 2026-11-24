import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { ShapeFieldKey } from './shape-field-key.type';
import type { ThermalShapeKey } from './thermal-shape-key.type';

export type ThermalShape = {
  value: ThermalShapeKey;
  label: string;
  fields: NumberFieldSpec<ShapeFieldKey>[];
};
