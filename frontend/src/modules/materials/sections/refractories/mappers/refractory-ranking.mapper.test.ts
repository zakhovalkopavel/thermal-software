import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { toRefractoryRanking } from './refractory-ranking.mapper';

const PRODUCTS = recordedResponse<RefractoryProductSummary[]>('GET /refractory/refractories');

describe('refractories › refractory-ranking', () => {
  it('ranks products by λ ascending and skips products without results', () => {
    const ranking = toRefractoryRanking(
      {
        chamotte_solid: [{ material: 'chamotte_solid', T_K: 1273.15, lambda_WmK: 1.32, emissivity: 0.78 }],
        mullite_2300: [{ material: 'mullite_2300', T_K: 1273.15, lambda_WmK: 0.36, emissivity: 0.7 }],
        alumina_2500: [],
      },
      PRODUCTS,
    );
    expect(ranking).toMatchInlineSnapshot(`
      {
        "categories": [
          "Mullite brick 2300 kg/m³",
          "Chamotte solid (dense fire brick)",
        ],
        "series": [
          {
            "data": [
              {
                "color": "rgb(123,31,162)",
                "y": 0.36,
              },
              {
                "color": "rgb(176,83,43)",
                "y": 1.32,
              },
            ],
            "name": "λ",
          },
        ],
      }
    `);
  });
});
