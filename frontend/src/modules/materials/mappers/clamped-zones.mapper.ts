import type { XYSeries } from '../../../components/charts';
import type { TemperatureRange } from '../types/temperature-range.type';

/** Line zones along x: dotted outside the ε validity range, `inside` style within it. `toX` maps K to the chart's x unit. */
export function toClampedZones(
  range: TemperatureRange,
  inside: 'Solid' | 'Dash',
  toX: (T_K: number) => number = (T_K) => T_K,
): NonNullable<XYSeries['zones']> {
  return [
    { value: toX(range.min), dashStyle: 'ShortDot' },
    { value: toX(range.max), dashStyle: inside },
    { dashStyle: 'ShortDot' },
  ];
}
