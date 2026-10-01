import { describe, expect, it } from 'vitest';
import { SODA_LIME_CURVE } from '../../../../../../tests/fixtures/inputs/soda-lime-glass-curve';
import { toViscositySeries } from './viscosity-series.mapper';

describe('glasses › viscosity-series', () => {
  it('plots η = 10^logViscosity; the user glass is emphasised, references dashed and flagged when substituted', () => {
    const reference = { ...SODA_LIME_CURVE, key: 'ref', name: 'Borosilicate', isUser: false, swapped: true };
    expect(toViscositySeries([SODA_LIME_CURVE, reference])).toMatchInlineSnapshot(`
      [
        {
          "dashStyle": undefined,
          "data": [
            [
              800,
              1584893.1924611141,
            ],
            [
              1200,
              1258.9254117941675,
            ],
          ],
          "emphasis": true,
          "name": "My glass — Fluegel 2007",
        },
        {
          "dashStyle": "Dash",
          "data": [
            [
              800,
              1584893.1924611141,
            ],
            [
              1200,
              1258.9254117941675,
            ],
          ],
          "emphasis": false,
          "name": "Borosilicate — Fluegel 2007 ⚠ substituted",
        },
      ]
    `);
  });

  it('skips curves without a profile', () => {
    expect(toViscositySeries([{ ...SODA_LIME_CURVE, profile: undefined }])).toEqual([]);
  });
});
