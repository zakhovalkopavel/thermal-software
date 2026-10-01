import { describe, expect, it } from 'vitest';
import { blendResult } from '../../../../../../tests/fixtures/inputs/blend-result';
import { toBlendMapSeries } from './blend-map-series.mapper';

describe('mineral-compositions › blend-map-series', () => {
  it('groups bubbles by PSD method with the method label', () => {
    expect(
      toBlendMapSeries([
        blendResult({ rank: 1 }),
        blendResult({ rank: 2, method: 'FunkDinger', q: 0.3, packingModel: 'Furnas', scenario: 'Flowable' }),
        blendResult({ rank: 3, q: 0.3 }),
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "data": [
            {
              "id": "1",
              "label": "#1 · q 0.25 · CPM · Vibratable",
              "x": 5.2,
              "y": 0.82,
              "z": 18,
            },
            {
              "id": "3",
              "label": "#3 · q 0.3 · CPM · Vibratable",
              "x": 5.2,
              "y": 0.82,
              "z": 18,
            },
          ],
          "name": "Andreasen",
        },
        {
          "data": [
            {
              "id": "2",
              "label": "#2 · q 0.3 · Furnas · Flowable",
              "x": 5.2,
              "y": 0.82,
              "z": 18,
            },
          ],
          "name": "Funk–Dinger",
        },
      ]
    `);
  });

  it('keeps an unknown method name as is', () => {
    expect(toBlendMapSeries([blendResult({ method: 'Dinger2025' })])[0].name).toBe('Dinger2025');
  });
});
