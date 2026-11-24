import { describe, expect, it } from 'vitest';
import type { BedLayerResult } from '../../../types/bed-layer-result.type';
import { toBedProfileSeries } from './bed-profile-series.mapper';

const layer = (index: number, z_m: number, tGas_K: number, moleFractions: Record<string, number>): BedLayerResult => ({
  index,
  z_m,
  tGas_K,
  tSolid_K: tGas_K + 40,
  deltaT_K: 40,
  moleFractions,
  carbonBurnRate_kgs: 1e-4,
  fuelBurnRate_kgs: 1.2e-4,
  burnRatePerArea_g_s_cm2: 0.002,
  wallLoss_W: 12,
  tWallInner_K: null,
  tWallOuter_K: null,
  hConv_Wm2K: 35,
  velocity_ms: 0.4,
  pressureDrop_Pa: 3,
  steamInjected: false,
});

describe('combustion › bed-profile-series', () => {
  it('plots gas and solid T on axis 0 and O2 / CO2 / CO in mol % on axis 1', () => {
    expect(
      toBedProfileSeries([layer(0, 0.01, 900, { O2: 0.18, CO2: 0.03 }), layer(1, 0.03, 1400, { O2: 0.02, CO2: 0.15, CO: 0.04 })]),
    ).toMatchInlineSnapshot(`
      [
        {
          "data": [
            [
              0.01,
              900,
            ],
            [
              0.03,
              1400,
            ],
          ],
          "emphasis": true,
          "name": "Gas T",
          "unit": "K",
        },
        {
          "data": [
            [
              0.01,
              940,
            ],
            [
              0.03,
              1440,
            ],
          ],
          "name": "Solid T",
          "unit": "K",
        },
        {
          "dashStyle": "Dash",
          "data": [
            [
              0.01,
              18,
            ],
            [
              0.03,
              2,
            ],
          ],
          "name": "O2",
          "unit": "%",
          "yAxis": 1,
        },
        {
          "dashStyle": "Dash",
          "data": [
            [
              0.01,
              3,
            ],
            [
              0.03,
              15,
            ],
          ],
          "name": "CO2",
          "unit": "%",
          "yAxis": 1,
        },
        {
          "dashStyle": "Dash",
          "data": [
            [
              0.01,
              0,
            ],
            [
              0.03,
              4,
            ],
          ],
          "name": "CO",
          "unit": "%",
          "yAxis": 1,
        },
      ]
    `);
  });
});
