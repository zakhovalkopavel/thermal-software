import { describe, expect, it } from 'vitest';
import { WALL_PRESETS } from '../constants/wall-presets.constants';
import { toWallDraftFromPreset } from './wall-draft-from-preset.mapper';
import { withSmoke } from './smoke-into-wall-draft.mapper';

describe('multilayer-wall › smoke-into-wall-draft', () => {
  it('pre-fills flame T, gas flow and composition and keeps the rest', () => {
    const draft = toWallDraftFromPreset(WALL_PRESETS[0]);
    const composition = { N2: 0.75, O2: 0.03, CO2: 0.12, CO: 0, H2O: 0.1, H2: 0 };
    const result = withSmoke(draft, { tFlame_K: 1850, mGas_kgs: 0.0084, composition });
    expect(result.values).toEqual({ ...draft.values, tFlame_K: 1850, mPerSecond_kgs: 0.0084 });
    expect(result.composition).toEqual(composition);
    expect(result.composition).not.toBe(composition);
    expect(result.layers).toBe(draft.layers);
  });
});
