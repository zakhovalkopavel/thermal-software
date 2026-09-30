import type { WallLayer } from '../types/wall-layer.type';
import type { WallLayerDraft } from '../types/wall-layer-draft.type';
import type { MaterialPickerKind } from '../../materials';

let counter = 0;

export function toNewWallLayerDraft(layer?: WallLayer, kind: MaterialPickerKind = 'refractory'): WallLayerDraft {
  counter += 1;
  return {
    id: `layer-${counter}`,
    material: layer ? { kind, materialId: layer.material } : null,
    thicknessMm: layer?.thicknessMm ?? null,
  };
}
