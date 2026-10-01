import { describe, expect, it } from 'vitest';
import { toRelativeDepthGrid } from './relative-depth-grid.mapper';

describe('thermal-distribution › relative-depth-grid', () => {
  it('spreads ξ from the centre (0) to the surface (1)', () => {
    expect(toRelativeDepthGrid(5)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(toRelativeDepthGrid(21)).toHaveLength(21);
  });
});
