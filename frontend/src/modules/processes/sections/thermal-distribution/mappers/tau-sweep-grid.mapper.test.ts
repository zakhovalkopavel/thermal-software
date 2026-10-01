import { describe, expect, it } from 'vitest';
import { toTauSweepGrid } from './tau-sweep-grid.mapper';

describe('thermal-distribution › tau-sweep-grid', () => {
  it('spreads τ up to τ_max, skipping τ = 0', () => {
    expect(toTauSweepGrid(600, 4)).toEqual([150, 300, 450, 600]);
  });

  it('rejects a missing end time and an invalid point count', () => {
    expect(() => toTauSweepGrid(null, 4)).toThrow('Enter a positive end time.');
    expect(() => toTauSweepGrid(0, 4)).toThrow('Enter a positive end time.');
    expect(() => toTauSweepGrid(600, null)).toThrow('Enter the number of points.');
    expect(() => toTauSweepGrid(600, 1)).toThrow('Use 2–30 points.');
  });
});
