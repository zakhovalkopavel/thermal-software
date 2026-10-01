import { describe, expect, it } from 'vitest';
import { toGasPropertySeries } from './gas-property-series.mapper';

describe('gases › gas-property-series', () => {
  it('sorts rows by temperature, skips missing values and drops empty series', () => {
    const series = toGasPropertySeries(
      [
        {
          name: 'Nitrogen',
          rows: [
            { T_K: 500, Cp_J_kgK: 1056.4, Pr: 0.7 },
            { T_K: 300, Cp_J_kgK: 1040.2 },
            { T_K: 400, Pr: 0.69 },
          ],
        },
        { name: 'Argon', rows: [{ T_K: 300, Pr: 0.66 }] },
      ],
      'Cp_J_kgK',
    );
    expect(series).toEqual([
      {
        name: 'Nitrogen',
        data: [
          [300, 1040.2],
          [500, 1056.4],
        ],
      },
    ]);
  });
});
