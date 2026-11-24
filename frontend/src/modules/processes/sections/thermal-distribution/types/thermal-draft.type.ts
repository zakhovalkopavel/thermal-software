import type { BcType } from './bc-type.type';
import type { InitialProfile } from './initial-profile.type';
import type { ShapeFieldKey } from './shape-field-key.type';
import type { ThermalFieldKey } from './thermal-field-key.type';
import type { ThermalShapeKey } from './thermal-shape-key.type';

export type ThermalDraft = {
  bcType: BcType;
  geometry: ThermalShapeKey;
  initialProfile: InitialProfile;
  values: Record<ThermalFieldKey, number | null>;
  shape: Record<ShapeFieldKey, number | null>;
};
