import { describe, expect, it } from 'vitest';
import { SHRINKAGE_RESULT } from '../../../../../../tests/fixtures/inputs/shrinkage-result';
import { toShrinkageSeries } from './shrinkage-series.mapper';

describe('mineral-compositions › shrinkage-series', () => {
  it('prepends the drying point to the total and lists sintering per firing temperature', () => {
    expect(toShrinkageSeries(SHRINKAGE_RESULT)).toEqual([
      {
        name: 'Total (drying + sintering)',
        emphasis: true,
        showMarkers: true,
        data: [
          [110, 0.1],
          [1000, 0.4],
          [1400, 1.0],
        ],
      },
      {
        name: 'Sintering only',
        dashStyle: 'Dash',
        showMarkers: true,
        data: [
          [1000, 0.3],
          [1400, 0.9],
        ],
      },
    ]);
  });
});
