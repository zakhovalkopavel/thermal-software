import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { MaterialEntry } from '../../../types/material-entry.type';
import { toCompositionCompareBars } from './composition-compare-bars.mapper';

const GLASSES = recordedResponse<MaterialEntry[]>('GET /refractory/glasses');

describe('glasses › composition-compare-bars', () => {
  it('stacks one series per oxide, largest oxide first, zero where a glass lacks it', () => {
    expect(toCompositionCompareBars(GLASSES.slice(0, 2))).toMatchInlineSnapshot(`
      {
        "categories": [
          "Flint Glass (Clear Bottles)",
          "Soda-Lime Glass",
        ],
        "series": [
          {
            "data": [
              72.5,
              72,
            ],
            "name": "SiO2",
          },
          {
            "data": [
              13.5,
              14,
            ],
            "name": "Na2O",
          },
          {
            "data": [
              10,
              10,
            ],
            "name": "CaO",
          },
          {
            "data": [
              2.5,
              2.5,
            ],
            "name": "MgO",
          },
          {
            "data": [
              1.2,
              1,
            ],
            "name": "Al2O3",
          },
          {
            "data": [
              0,
              0.5,
            ],
            "name": "K2O",
          },
          {
            "data": [
              0.25,
              0,
            ],
            "name": "SO3",
          },
          {
            "data": [
              0.05,
              0,
            ],
            "name": "Fe2O3",
          },
        ],
      }
    `);
  });

  it('drops oxides that are zero in every glass', () => {
    const result = toCompositionCompareBars([{ name: 'Silica', composition: { SiO2: 100, B2O3: 0 } }]);
    expect(result.series).toEqual([{ name: 'SiO2', data: [100] }]);
  });
});
