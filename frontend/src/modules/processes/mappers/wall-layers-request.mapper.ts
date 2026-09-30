import type { WallLayer } from '../types/wall-layer.type';
import type { WallLayerDraft } from '../types/wall-layer-draft.type';

/** Throws a user-facing message when a layer has no material or thickness. */
export function toWallLayers(drafts: WallLayerDraft[], title = 'Wall'): WallLayer[] {
  return drafts.map((draft, index) => {
    if (!draft.material) throw new Error(`${title}: choose the material of layer ${index + 1}.`);
    if (draft.thicknessMm === null || draft.thicknessMm <= 0) throw new Error(`${title}: enter the thickness of layer ${index + 1}.`);
    return { material: draft.material.materialId, thicknessMm: draft.thicknessMm };
  });
}
