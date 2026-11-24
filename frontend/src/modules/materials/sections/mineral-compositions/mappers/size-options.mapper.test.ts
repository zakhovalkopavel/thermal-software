import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { ParticleSizes } from '../../../types/particle-sizes.type';
import { toSizeOptions } from './size-options.mapper';

const SIZES = recordedResponse<ParticleSizes>('GET /refractory/particle-sizes');
const TOTAL = Object.values(SIZES).reduce((sum, group) => sum + Object.keys(group).length, 0);

describe('mineral-compositions › size-options', () => {
  it('lists every catalogue class once, grouped', () => {
    const options = toSizeOptions(SIZES);
    expect(options).toHaveLength(TOTAL);
    expect([...new Set(options.map((option) => option.groupLabel))]).toMatchInlineSnapshot(`
      [
        "Standard classes",
        "Classifications",
        "Cement",
        "Mesh",
        "FEPA F",
        "FEPA P",
      ]
    `);
  });

  it("moves the material's available sizes to the top", () => {
    const options = toSizeOptions(SIZES, ['COARSE_6_3', 'MEDIUM_3_1', 'NOT_A_CODE']);
    expect(options).toHaveLength(TOTAL);
    expect(options.slice(0, 3)).toMatchInlineSnapshot(`
      [
        {
          "code": "COARSE_6_3",
          "groupLabel": "Available for this material",
          "key": "standard:COARSE_6_3",
          "range": {
            "d50_mm": 4.5,
            "dMax_mm": 6,
            "dMin_mm": 3,
            "grade": "Coarse 3-6mm",
          },
        },
        {
          "code": "MEDIUM_3_1",
          "groupLabel": "Available for this material",
          "key": "standard:MEDIUM_3_1",
          "range": {
            "d50_mm": 2,
            "dMax_mm": 3,
            "dMin_mm": 1,
            "grade": "Medium 1-3mm",
          },
        },
        {
          "code": "COARSE_10_6",
          "groupLabel": "Standard classes",
          "key": "standard:COARSE_10_6",
          "range": {
            "d50_mm": 8,
            "dMax_mm": 10,
            "dMin_mm": 6,
            "grade": "Coarse 6-10mm",
          },
        },
      ]
    `);
  });

  it('is empty before the catalogue loads', () => {
    expect(toSizeOptions(undefined)).toEqual([]);
  });
});
