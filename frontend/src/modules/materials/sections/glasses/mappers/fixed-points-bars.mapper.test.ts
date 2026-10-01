import { describe, expect, it } from 'vitest';
import { SODA_LIME_CURVE } from '../../../../../../tests/fixtures/inputs/soda-lime-glass-curve';
import { toFixedPointsBars } from './fixed-points-bars.mapper';

describe('glasses › fixed-points-bars', () => {
  it('builds a series per curve with fixed points and lists curves without them as omitted', () => {
    const hetherington = {
      ...SODA_LIME_CURVE,
      key: 'ref',
      name: 'Slag',
      isUser: false,
      profile: { ...SODA_LIME_CURVE.profile!, fixedPoints: null },
    };
    const failed = { ...SODA_LIME_CURVE, key: 'failed', name: 'Failed', profile: undefined };
    expect(toFixedPointsBars([SODA_LIME_CURVE, hetherington, failed])).toMatchInlineSnapshot(`
      {
        "categories": [
          "Melting (10¹)",
          "Working (10³)",
          "Softening (10⁶·⁶)",
          "Annealing (10¹²)",
          "Strain (10¹³·⁵)",
        ],
        "omitted": [
          "Slag",
        ],
        "series": [
          {
            "data": [
              1455,
              1005,
              724,
              546,
              506,
            ],
            "name": "My glass",
          },
        ],
        "spans": {
          "My glass": {
            "annealingToStrain_C": 40,
            "meltingToStrain_C": 949,
            "softeningToAnnealing_C": 178,
            "workingToSoftening_C": 281,
          },
        },
      }
    `);
  });
});
