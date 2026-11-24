import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { toWallLayers } from '../../../mappers/wall-layers-request.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import type { MultilayerWallInput } from '../../../types/multilayer-wall-input.type';
import type { SmokeComposition } from '../../../types/smoke-composition.type';
import { WALL_FIELDS } from '../constants/wall-fields.constants';
import type { WallDraft } from '../types/wall-draft.type';

/** Throws a user-facing message when a required field or layer is missing. */
export function toMultilayerWallInput(draft: WallDraft): MultilayerWallInput {
  assertRequiredNumbers([...WALL_FIELDS.geometry, ...WALL_FIELDS.gas], draft.values);
  if (draft.layers.length === 0) throw new Error('Add at least one wall layer.');
  const { a_m, w_ms, mPerSecond_kgs, tFlame_K, tAmbient_K, innerEmissivity, ...optional } = draft.values;
  return {
    geometry: draft.geometry,
    a_m: a_m as number,
    layers: toWallLayers(draft.layers),
    w_ms: w_ms as number,
    composition: draft.composition as SmokeComposition,
    mPerSecond_kgs: mPerSecond_kgs as number,
    tFlame_K: tFlame_K as number,
    tAmbient_K: tAmbient_K as number,
    innerEmissivity: innerEmissivity as number,
    ...withoutNulls(optional),
  };
}
