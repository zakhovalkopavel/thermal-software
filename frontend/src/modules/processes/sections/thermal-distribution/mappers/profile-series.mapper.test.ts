import { describe, expect, it } from 'vitest';
import { toProfileSeries } from './profile-series.mapper';

describe('thermal-distribution › profile-series', () => {
  it('builds one series per solved time and skips failed ones', () => {
    expect(
      toProfileSeries(
        [0, 0.5, 1],
        [
          { tau: 30, temperatures: [845, 812, 640] },
          { tau: 60, error: new Error('did not converge') },
          { tau: 120, temperatures: [790, 720, 410] },
        ],
      ),
    ).toEqual([
      { name: 'τ = 30 s', unit: '°C', data: [[0, 845], [0.5, 812], [1, 640]] },
      { name: 'τ = 120 s', unit: '°C', data: [[0, 790], [0.5, 720], [1, 410]] },
    ]);
  });
});
