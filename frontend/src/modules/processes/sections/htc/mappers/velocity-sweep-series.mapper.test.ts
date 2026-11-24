import { describe, expect, it } from 'vitest';
import { dimensionlessResult } from '../../../../../../tests/fixtures/inputs/dimensionless-result';
import { toVelocitySweepSeries } from './velocity-sweep-series.mapper';

describe('htc › velocity-sweep-series', () => {
  it('plots h and Re against velocity, skipping failed points and Re = 0 on the log axis', () => {
    expect(
      toVelocitySweepSeries([
        { w_m_s: 0, result: dimensionlessResult({ Re: 0, h_W_m2K: 4.2 }) },
        { w_m_s: 1, error: new Error('failed') },
        { w_m_s: 5, result: dimensionlessResult() },
      ]),
    ).toEqual({
      h: [
        [0, 4.2],
        [5, 61.6],
      ],
      re: [[5, 12000]],
    });
  });
});
