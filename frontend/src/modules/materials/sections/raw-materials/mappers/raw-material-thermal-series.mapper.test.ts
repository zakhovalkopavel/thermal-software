import { describe, expect, it } from 'vitest';
import type { RawMaterialThermalPoint } from '../types/raw-material-thermal-point.type';
import { toRawMaterialThermalSeries } from './raw-material-thermal-series.mapper';

const point = (materialId: string, temperature_C: number, porosity: number, lambda_WmK: number): RawMaterialThermalPoint => ({
  materialId,
  temperature_C,
  porosity,
  lambda_WmK,
  cp_JkgK: 900 + temperature_C / 4,
  rho_kgm3: 2500 * (1 - porosity),
  diffusivity_m2s: 5e-7,
});

const POINTS = [
  point('kaolin', 800, 0.2, 0.82),
  point('kaolin', 20, 0.2, 0.95),
  point('kaolin', 20, 0, 1.6),
  point('kaolin', 800, 0, 1.35),
  point('alumina_calcined', 20, 0.2, 18.2),
];
const NAMES = { kaolin: 'Kaolin' };

describe('raw-materials › raw-material-thermal-series', () => {
  it('keeps only the chosen porosity and sorts by temperature', () => {
    expect(toRawMaterialThermalSeries(POINTS, NAMES, 'lambda_WmK', 0.2, false)).toMatchInlineSnapshot(`
      [
        {
          "dashStyle": undefined,
          "data": [
            [
              20,
              0.95,
            ],
            [
              800,
              0.82,
            ],
          ],
          "name": "Kaolin",
        },
        {
          "dashStyle": undefined,
          "data": [
            [
              20,
              18.2,
            ],
          ],
          "name": "alumina_calcined",
        },
      ]
    `);
  });

  it('adds a dashed dense series per material when asked', () => {
    const series = toRawMaterialThermalSeries(POINTS, NAMES, 'cp_JkgK', 0.2, true);
    expect(series.map((item) => [item.name, item.dashStyle, item.data.length])).toMatchInlineSnapshot(`
      [
        [
          "Kaolin",
          undefined,
          2,
        ],
        [
          "Kaolin (P = 0)",
          "Dash",
          2,
        ],
        [
          "alumina_calcined",
          undefined,
          1,
        ],
      ]
    `);
  });
});
