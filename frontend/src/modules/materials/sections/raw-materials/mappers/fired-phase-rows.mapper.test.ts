import { describe, expect, it } from 'vitest';
import { toFiredPhaseRows } from './fired-phase-rows.mapper';

describe('raw-materials › fired-phase-rows', () => {
  it('sorts phases by decreasing share', () => {
    expect(toFiredPhaseRows({ C: 0.5, SiC: 98.99, SiO2: 0.51 })).toEqual([
      { phase: 'SiC', share_wt: 98.99 },
      { phase: 'SiO2', share_wt: 0.51 },
      { phase: 'C', share_wt: 0.5 },
    ]);
  });
});
