import { describe, expect, it } from 'vitest';
import type { MultilayerWallResult } from '../../../types/multilayer-wall-result.type';
import { toWallProfile } from './wall-profile.mapper';

const RESULT: MultilayerWallResult = {
  tInner_K: 1373.15,
  tOuter_K: 343.15,
  tGasEnd_K: 1400,
  tGasAverage_K: 1435,
  betweenLayers: [{ name: 'chamotte_solid | chamotte_600', tCelsius: 820 }],
  temperatureProfile: [
    { x_mm: 0, tCelsius: 1100 },
    { x_mm: 100, tCelsius: 950 },
    { x_mm: 200, tCelsius: 820 },
    { x_mm: 300, tCelsius: 70 },
  ],
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
  it('maps the backend finite-difference profile to [mm, °C] pairs', () => {
    expect(toWallProfile(RESULT)).toEqual([
      [0, 1100],
      [100, 950],
      [200, 820],
      [300, 70],
    ]);
  });
});
