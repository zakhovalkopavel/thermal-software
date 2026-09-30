import { toNewWallLayerDraft } from '../../../mappers/new-wall-layer-draft.mapper';
import type { WallDraft } from '../types/wall-draft.type';
import type { WallPreset } from '../types/wall-preset.type';

export function toWallDraftFromPreset(preset: WallPreset): WallDraft {
  return {
    ...preset.draft,
    values: { ...preset.draft.values },
    composition: { ...preset.draft.composition },
    layers: preset.layers.map(({ kind, ...layer }) => toNewWallLayerDraft(layer, kind)),
  };
}
