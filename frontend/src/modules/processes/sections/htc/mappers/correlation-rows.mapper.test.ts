import { describe, expect, it } from 'vitest';
import { dimensionlessResult } from '../../../../../../tests/fixtures/inputs/dimensionless-result';
import { toCorrelationRows } from './correlation-rows.mapper';

describe('htc › correlation-rows', () => {
  it('scales h by Nu from the used correlation and marks it', () => {
    const rows = toCorrelationRows(
      dimensionlessResult({
        Nu: 40,
        h_W_m2K: 64,
        allCorrelations: {
          gnielinski: { Nu: 40, rangeValid: true },
          dittus_boelter: { Nu: 44, rangeValid: true },
          transitional: { Nu: 30, rangeValid: false, warning: 'Re above range' },
        },
      }),
    );
    expect(rows).toEqual([
      { name: 'gnielinski', Nu: 40, h_W_m2K: 64, rangeValid: true, warning: undefined, used: true },
      { name: 'dittus_boelter', Nu: 44, h_W_m2K: expect.closeTo(70.4), rangeValid: true, warning: undefined, used: false },
      { name: 'transitional', Nu: 30, h_W_m2K: expect.closeTo(48), rangeValid: false, warning: 'Re above range', used: false },
    ]);
  });

  it('is empty without a comparison and gives h = 0 when Nu = 0', () => {
    expect(toCorrelationRows(dimensionlessResult())).toEqual([]);
    const [row] = toCorrelationRows(dimensionlessResult({ Nu: 0, allCorrelations: { mills: { Nu: 3.66, rangeValid: true } } }));
    expect(row.h_W_m2K).toBe(0);
  });
});
