import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import type { MetalSummary } from '../../../types/metal-summary.type';
import { METAL_RESULT_PROPERTIES } from '../constants/metal-result-properties.constants';
import { toMetalPropertySeries } from './metal-property-series.mapper';

const METALS = recordedResponse<MetalSummary[]>('GET /metals/list');
const LAMBDA = METAL_RESULT_PROPERTIES.find((p) => p.key === 'lambda_WmK')!;
const EPS = METAL_RESULT_PROPERTIES.find((p) => p.key === 'emissivity')!;
const CP = METAL_RESULT_PROPERTIES.find((p) => p.key === 'specificHeat_JkgK')!;

describe('metals › metal-property-series', () => {
  it('builds a λ series sorted by temperature', () => {
    const series = toMetalPropertySeries(
      {
        aisi_304: [
          { material: 'aisi_304', T_K: 800, lambda_WmK: 21.3, emissivity: 0.42 },
          { material: 'aisi_304', T_K: 400, lambda_WmK: 16.6, emissivity: 0.36 },
        ],
      },
      METALS,
      LAMBDA,
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
      ]
    `);
  });

  it('adds clamp zones for emissivity when the grade has a range', () => {
    const [emissivity] = toMetalPropertySeries(
      {
        aisi_304: [
          { material: 'aisi_304', T_K: 800, lambda_WmK: 21.3, emissivity: 0.42 },
          { material: 'aisi_304', T_K: 400, lambda_WmK: 16.6, emissivity: 0.36 },
        ],
      },
      METALS,
      EPS,
    );
    expect(emissivity.zones).toEqual([
      { value: 600, dashStyle: 'ShortDot' },
      { value: 1400, dashStyle: 'Dash' },
      { dashStyle: 'ShortDot' },
    ]);
  });

  it('falls back to the id and omits zones for an unknown grade', () => {
    const [emissivity] = toMetalPropertySeries(
      { unknown_alloy: [{ material: 'unknown_alloy', T_K: 500, lambda_WmK: 30, emissivity: 0.5 }] },
      METALS,
      EPS,
    );
    expect(emissivity.name).toBe('ε — unknown_alloy');
    expect(emissivity.zones).toBeUndefined();
  });

  it('drops temperatures without the selected property', () => {
    const [cp] = toMetalPropertySeries(
      {
        '4340': [
          { material: '4340', T_K: 300, lambda_WmK: 40 },
          { material: '4340', T_K: 500, lambda_WmK: 42, specificHeat_JkgK: 480 },
        ],
      },
      METALS,
      CP,
    );
    expect(cp.data).toEqual([[500, 480]]);
  });

  it('maps the x axis through toX (e.g. °C)', () => {
    const [lambda] = toMetalPropertySeries(
      { '4340': [{ material: '4340', T_K: 500, lambda_WmK: 42 }] },
      METALS,
      LAMBDA,
      kelvinToCelsius,
    );
    expect(lambda.data).toEqual([[kelvinToCelsius(500), 42]]);
  });
});
