import { describe, expect, it } from 'vitest';
import { CHART_THEME } from '@/shared/ui/charts';
import { toClampedBands } from './clamped-bands.mapper';

const RANGE = { min: 600, max: 1400 };
const LABEL = 'ε clamped';

describe('materials › clamped-bands', () => {
  it('shades both sides when the plot extends beyond the validity range', () => {
    expect(toClampedBands(RANGE, 300, 1600, LABEL)).toEqual([
      { from: 300, to: 600, label: LABEL, color: CHART_THEME.warningBandColor },
      { from: 1400, to: 1600, label: LABEL, color: CHART_THEME.warningBandColor },
    ]);
  });

  it('returns no band when the plot lies inside the range', () => {
    expect(toClampedBands(RANGE, 700, 1200, LABEL)).toEqual([]);
  });

  it('maps K to the chart x unit', () => {
    const halve = (T_K: number) => T_K / 2;
    expect(toClampedBands(RANGE, 0, 500, LABEL, halve)).toEqual([
      { from: 0, to: 300, label: LABEL, color: CHART_THEME.warningBandColor },
    ]);
  });
});
