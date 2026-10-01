import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { MaterialCategory } from '../../../types/material-category.type';
import type { MaterialEntry } from '../../../types/material-entry.type';
import { toMixStructure } from './mix-structure.mapper';

const COMPONENTS = new Map<string, MaterialEntry>(
  recordedResponse<MaterialCategory[]>('GET /refractory/mix-components')
    .flatMap((category) => category.materials)
    .map((material) => [material.materialId, material]),
);

describe('mineral-compositions › mix-structure', () => {
  it('stacks one series per material over the size classes, coarse first', () => {
    expect(toMixStructure(CASTABLE_MIX_FRACTIONS, COMPONENTS)).toMatchInlineSnapshot(`
      {
        "categories": [
          "3–6 mm",
          "1–3 mm",
          "0.1–0.3 mm",
          "0.001–0.045 mm",
          "5.000·10⁻⁴–0.005 mm",
        ],
        "series": [
          {
            "data": [
              35,
              25,
              null,
              null,
              null,
            ],
            "name": "Tabular Alumina",
            "stack": "mix",
          },
          {
            "data": [
              null,
              null,
              20,
              null,
              null,
            ],
            "name": "Calcined Alumina",
            "stack": "mix",
          },
          {
            "data": [
              null,
              null,
              null,
              15,
              null,
            ],
            "name": "Calcium Aluminate Cement (CA-70)",
            "stack": "mix",
          },
          {
            "data": [
              null,
              null,
              null,
              null,
              5,
            ],
            "name": "Reactive Alumina",
            "stack": "mix",
          },
        ],
      }
    `);
  });

  it('sums rows of the same material and size', () => {
    const [first] = CASTABLE_MIX_FRACTIONS;
    const result = toMixStructure([first, { ...first, id: 'dup', massPercent: 5 }], COMPONENTS);
    expect(result.series[0].data).toEqual([40]);
  });
});
