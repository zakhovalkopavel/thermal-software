import { describe, expect, it } from 'vitest';
import { HTC_DEFAULTS } from '../constants/htc-defaults.constants';
import { toVelocityGrid } from './velocity-grid.mapper';

describe('htc › velocity-grid', () => {
  it('spreads the points evenly, both ends included', () => {
    expect(toVelocityGrid({ from_m_s: 1, to_m_s: 3, points: 5 })).toEqual([1, 1.5, 2, 2.5, 3]);
    const grid = toVelocityGrid(HTC_DEFAULTS.sweep);
    expect(grid).toHaveLength(20);
    expect([grid[0], grid[grid.length - 1]]).toEqual([0.5, 20]);
  });

  it('rejects missing values, a non-positive or reversed range and too many points', () => {
    expect(() => toVelocityGrid({ from_m_s: null, to_m_s: 3, points: 5 })).toThrow('Enter the velocity range and the number of points.');
    expect(() => toVelocityGrid({ from_m_s: 0, to_m_s: 3, points: 5 })).toThrow('Velocities must satisfy 0 < from < to.');
    expect(() => toVelocityGrid({ from_m_s: 3, to_m_s: 1, points: 5 })).toThrow('Velocities must satisfy 0 < from < to.');
    expect(() => toVelocityGrid({ from_m_s: 1, to_m_s: 3, points: 26 })).toThrow('Use 2–25 points.');
  });
});
