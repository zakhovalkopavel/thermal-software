import { describe, expect, it } from 'vitest';
import { WALL_PRESETS } from '../constants/wall-presets.constants';
import { toWallDraftFromPreset } from './wall-draft-from-preset.mapper';
import { toMultilayerWallInput } from './wall-request.mapper';
import { toWallBands } from './wall-bands.mapper';

describe('multilayer-wall › wall-bands', () => {
  it('stacks one band per layer by thickness, falling back to the material id for a missing name', () => {
    const input = toMultilayerWallInput(toWallDraftFromPreset(WALL_PRESETS[0]));
    expect(toWallBands({ input, layerNames: ['Chamotte solid (dense fire brick)'] })).toEqual([
      { from: 0, to: 200, label: 'Chamotte solid (dense fire brick)' },
      { from: 200, to: 300, label: 'chamotte_600' },
    ]);
  });
});
