import { describe, expect, it } from 'vitest';
import { WALL_PRESETS } from '../constants/wall-presets.constants';
import { toWallDraftFromPreset } from './wall-draft-from-preset.mapper';
import { toMultilayerWallInput } from './wall-request.mapper';

const DRAFT = toWallDraftFromPreset(WALL_PRESETS[0]);

describe('multilayer-wall › wall-request', () => {
  it('maps the flat chamotte preset', () => {
    expect(toMultilayerWallInput(DRAFT)).toMatchInlineSnapshot(`
      {
        "a_m": 0.5,
        "b_m": 2,
        "composition": {
          "CO": 0,
          "CO2": 0.13,
          "H2": 0,
          "H2O": 0.13,
          "N2": 0.72,
          "O2": 0.02,
        },
        "geometry": "flat",
        "innerEmissivity": 0.85,
        "layers": [
          {
            "material": "chamotte_solid",
            "thicknessMm": 200,
          },
          {
            "material": "chamotte_600",
            "thicknessMm": 100,
          },
        ],
        "mPerSecond_kgs": 0.5,
        "tAmbient_K": 293,
        "tFlame_K": 1473,
        "w_ms": 4,
      }
    `);
  });

  it('rejects a missing required field or no layers', () => {
    expect(() => toMultilayerWallInput({ ...DRAFT, values: { ...DRAFT.values, tFlame_K: null } })).toThrow(/^Enter /);
    expect(() => toMultilayerWallInput({ ...DRAFT, layers: [] })).toThrow('Add at least one wall layer.');
  });
});
