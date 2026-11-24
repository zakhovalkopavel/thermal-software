import type { WallGeometry } from '../../../types/wall-geometry.type';
import type { WallLayerDraft } from '../../../types/wall-layer-draft.type';
import type { WallFieldKey } from './wall-field-key.type';

export type WallDraft = {
  geometry: WallGeometry;
  values: Record<WallFieldKey, number | null>;
  layers: WallLayerDraft[];
  composition: Record<string, number>;
};
