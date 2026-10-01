import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { MetalSummary } from '../../../types/metal-summary.type';
import { toMetalPropertySeries } from './metal-property-series.mapper';

const METALS = recordedResponse<MetalSummary[]>('GET /metals/list');

describe('metals › metal-property-series', () => {
  it('builds a λ and an ε series per grade, sorted by temperature, with clamping zones on ε', () => {
    const series = toMetalPropertySeries(
      {
        aisi_304: [
          { material: 'aisi_304', T_K: 800, lambda_WmK: 21.3, emissivity: 0.42 },
          { material: 'aisi_304', T_K: 400, lambda_WmK: 16.6, emissivity: 0.36 },
        ],
      },
      METALS,
    );
    expect(series).toMatchInlineSnapshot(`
      [
        {
          "color": "#1976d2",
          "data": [
            [
              400,
              16.6,
            ],
            [
              800,
              21.3,
            ],
          ],
          "name": "λ — AISI 304 stainless steel",
          "unit": "W/(m·K)",
          "yAxis": 0,
        },
        {
          "color": "#1976d2",
          "dashStyle": "Dash",
          "data": [
            [
              400,
              0.36,
            ],
            [
              800,
              0.42,
            ],
          ],
          "name": "ε — AISI 304 stainless steel",
          "unit": "–",
          "yAxis": 1,
          "zones": [
            {
              "dashStyle": "ShortDot",
              "value": 600,
            },
            {
              "dashStyle": "Dash",
              "value": 1400,
            },
            {
              "dashStyle": "ShortDot",
            },
          ],
        },
      ]
    `);
  });

  it('falls back to the id and omits zones for an unknown grade', () => {
    const [lambda, emissivity] = toMetalPropertySeries(
      { unknown_alloy: [{ material: 'unknown_alloy', T_K: 500, lambda_WmK: 30, emissivity: 0.5 }] },
      METALS,
    );
    expect(lambda.name).toBe('λ — unknown_alloy');
    expect(emissivity.zones).toBeUndefined();
  });
});
