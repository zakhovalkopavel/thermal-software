import { describe, expect, it } from 'vitest';
import { toClampedZones } from './clamped-zones.mapper';

describe('materials › clamped-zones', () => {
  it('dots the line outside the range and uses the inside style within it', () => {
    expect(toClampedZones({ min: 600, max: 1400 }, 'Solid')).toEqual([
      { value: 600, dashStyle: 'ShortDot' },
      { value: 1400, dashStyle: 'Solid' },
      { dashStyle: 'ShortDot' },
    ]);
  });

  it('maps the zone limits to the chart x unit', () => {
    expect(toClampedZones({ min: 600, max: 1400 }, 'Dash', (T_K) => T_K / 2)).toEqual([
      { value: 300, dashStyle: 'ShortDot' },
      { value: 700, dashStyle: 'Dash' },
      { dashStyle: 'ShortDot' },
    ]);
  });
});
