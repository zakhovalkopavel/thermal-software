import { describe, expect, it } from 'vitest';
import { WALL_PRESETS } from '../constants/wall-presets.constants';
import { toWallDraftFromPreset } from './wall-draft-from-preset.mapper';

describe('multilayer-wall › wall-draft-from-preset', () => {
  it('copies the preset and turns its layers into drafts with their picker kind', () => {
    const preset = WALL_PRESETS[1];
    const draft = toWallDraftFromPreset(preset);
    expect(draft.geometry).toBe('cylinder');
    expect(draft.values).toEqual(preset.draft.values);
    expect(draft.values).not.toBe(preset.draft.values);
    expect(draft.composition).not.toBe(preset.draft.composition);
    expect(draft.layers.map(({ material, thicknessMm }) => ({ material, thicknessMm }))).toEqual([
      { material: { kind: 'metal', materialId: 'mild_steel' }, thicknessMm: 10 },
      { material: { kind: 'refractory', materialId: 'basalt_fiber_mat' }, thicknessMm: 80 },
    ]);
  });
});
