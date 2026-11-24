import { describe, expect, it } from 'vitest';
import { blendResult } from '../../../../../../tests/fixtures/inputs/blend-result';
import { toBlendBestBy } from './blend-best-by.mapper';

describe('mineral-compositions › blend-best-by', () => {
  it('picks the extreme result per criterion', () => {
    const results = [
      blendResult({ rank: 1, optimizationScore: 0.91, packingEfficiency: 0.8, waterDemand_percent: 5.6 }),
      blendResult({ rank: 2, optimizationScore: 0.88, packingEfficiency: 0.84, porosity_percent_green: 16, rhoBulk_gml_green: 2.98 }),
      blendResult({ rank: 3, optimizationScore: 0.85, waterDemand_percent: 4.8, porosity_percent_green: 19 }),
    ];
    expect(toBlendBestBy(results)).toMatchInlineSnapshot(`
      [
        {
          "id": "1",
          "label": "Score",
          "unit": undefined,
          "value": 0.91,
        },
        {
          "id": "2",
          "label": "Packing efficiency",
          "unit": undefined,
          "value": 0.84,
        },
        {
          "id": "3",
          "label": "Lowest water",
          "unit": "%",
          "value": 4.8,
        },
        {
          "id": "2",
          "label": "Lowest porosity",
          "unit": "%",
          "value": 16,
        },
        {
          "id": "2",
          "label": "Highest green density",
          "unit": "g/ml",
          "value": 2.98,
        },
      ]
    `);
  });

  it('is empty without results', () => {
    expect(toBlendBestBy([])).toEqual([]);
  });
});
