import { describe, expect, it } from 'vitest';
import { toGlassGrid } from './glass-grid.mapper';

describe('glasses › glass-grid', () => {
  it('returns the °C grid', () => {
    expect(toGlassGrid(400, 1600, 400)).toEqual([400, 800, 1200, 1600]);
  });

  it('enforces the glasses point limit', () => {
    expect(() => toGlassGrid(0, 1600, 1)).toThrow('The range gives 1601 points; the limit is 301. Increase the step.');
  });
});
