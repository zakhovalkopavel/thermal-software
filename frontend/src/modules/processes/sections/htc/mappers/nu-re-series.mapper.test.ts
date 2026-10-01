import { describe, expect, it } from 'vitest';
import { dimensionlessResult } from '../../../../../../tests/fixtures/inputs/dimensionless-result';
import { toNuReSeries } from './nu-re-series.mapper';

describe('htc › nu-re-series', () => {
  it('splits points by the correlation used and skips failed or non-positive points', () => {
    expect(
      toNuReSeries([
        { w_m_s: 0.5, result: dimensionlessResult({ Re: 1200, Nu: 3.66, correlation: 'mills' }) },
        { w_m_s: 1, error: new Error('solver failed') },
        { w_m_s: 5, result: dimensionlessResult({ Re: 12000, Nu: 38.5 }) },
        { w_m_s: 10, result: dimensionlessResult({ Re: 24000, Nu: 66 }) },
        { w_m_s: 0, result: dimensionlessResult({ Re: 0, Nu: 4 }) },
      ]),
    ).toEqual([
      { name: 'mills', data: [[1200, 3.66]], showMarkers: true },
      {
        name: 'gnielinski',
        data: [
          [12000, 38.5],
          [24000, 66],
        ],
        showMarkers: true,
      },
    ]);
  });
});
