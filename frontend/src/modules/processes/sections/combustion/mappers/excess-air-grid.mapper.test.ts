import { describe, expect, it } from 'vitest';
import { toExcessAirGrid } from './excess-air-grid.mapper';

describe('combustion › excess-air-grid', () => {
  it('sweeps λ from 1 to 2 in steps of 0.05 without float drift', () => {
    const grid = toExcessAirGrid();
    expect(grid).toHaveLength(21);
    expect(grid.slice(0, 4)).toEqual([1, 1.05, 1.1, 1.15]);
    expect(grid[grid.length - 1]).toBe(2);
  });
});
