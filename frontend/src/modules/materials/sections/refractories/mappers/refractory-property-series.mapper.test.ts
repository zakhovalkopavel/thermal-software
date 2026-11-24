import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { toRefractoryPropertySeries } from './refractory-property-series.mapper';

const PRODUCTS = recordedResponse<RefractoryProductSummary[]>('GET /refractory/refractories');
const BY_MATERIAL = {
  chamotte_solid: [
    { material: 'chamotte_solid', T_K: 1273.15, lambda_WmK: 1.32, emissivity: 0.78 },
    { material: 'chamotte_solid', T_K: 373.15, lambda_WmK: 1.05, emissivity: 0.85 },
  ],
};

describe('refractories › refractory-property-series', () => {
  it('plots λ against °C without zones', () => {
    const [series] = toRefractoryPropertySeries(BY_MATERIAL, PRODUCTS, 'lambda_WmK');
    expect(series.data).toEqual([
      [expect.closeTo(100), 1.05],
      [expect.closeTo(1000), 1.32],
    ]);
    expect(series.zones).toBeUndefined();
  });

  it('plots ε with clamping zones in °C', () => {
    expect(toRefractoryPropertySeries(BY_MATERIAL, PRODUCTS, 'emissivity')).toMatchInlineSnapshot(`
      [
        {
          "color": "rgb(176,83,43)",
          "data": [
            [
              100,
              0.85,
            ],
            [
              1000.0000000000001,
              0.78,
            ],
          ],
          "name": "Chamotte solid (dense fire brick)",
          "zones": [
            {
              "dashStyle": "ShortDot",
              "value": 399.85,
            },
            {
              "dashStyle": "Solid",
              "value": 1399.85,
            },
            {
              "dashStyle": "ShortDot",
            },
          ],
        },
      ]
    `);
  });
});
