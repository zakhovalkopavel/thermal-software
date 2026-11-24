import type { ShapeFieldKey } from './shape-field-key.type';
import type { ThermalShapeKey } from './thermal-shape-key.type';

export type ThermalShapeInput = { geometry: ThermalShapeKey } & Partial<Record<ShapeFieldKey, number>>;
