import { describe, expect, it } from 'vitest';
import type { MultilayerWallResult } from '../../../types/multilayer-wall-result.type';
import { WALL_PRESETS } from '../constants/wall-presets.constants';
import { toWallDraftFromPreset } from './wall-draft-from-preset.mapper';
import { toMultilayerWallInput } from './wall-request.mapper';
import { toWallProfile } from './wall-profile.mapper';

const INPUT = toMultilayerWallInput(toWallDraftFromPreset(WALL_PRESETS[0]));
const RESULT: MultilayerWallResult = {
  tInner_K: 1373.15,
  tOuter_K: 343.15,
  tGasEnd_K: 1400,
  tGasAverage_K: 1435,
  betweenLayers: [{ name: 'chamotte_solid | chamotte_600', tCelsius: 820 }],
  fluxInner_W: 1500,
  fluxOuter_W: 1480,
  fluxInnerDensity_Wm2: 1500,
  sInner_m2: 1,
  sOuter_m2: 1,
  alphaInner: { total_Wm2K: 152, convection_Wm2K: 12, radiation_Wm2K: 140 },
  alphaOuter_Wm2K: 11,
  totalThickness_mm: 300,
};

describe('multilayer-wall › wall-profile', () => {
  it('plots inner surface, each interface and outer surface in [mm, °C]', () => {
    expect(toWallProfile(INPUT, RESULT)).toEqual([
      [0, expect.closeTo(1100)],
      [200, 820],
      [300, expect.closeTo(70)],
    ]);
  });

  it('skips interfaces the backend did not return', () => {
    expect(toWallProfile(INPUT, { ...RESULT, betweenLayers: [] })).toHaveLength(2);
  });
});
