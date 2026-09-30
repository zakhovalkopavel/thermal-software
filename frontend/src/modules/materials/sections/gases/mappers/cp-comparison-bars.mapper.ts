import { CHART_THEME } from '../../../../../components/charts';
import type { CategorySeries } from '../../../../../components/charts';
import type { CpComparisonEntry } from '../types/cp-comparison-entry.type';

/** Categories "type (ref)", one series; entries outside their validity range greyed. Mean for deviation tooltips. */
export function toCpComparisonBars(entries: CpComparisonEntry[]): {
  categories: string[];
  series: CategorySeries[];
  mean: number;
} {
  const mean = entries.reduce((sum, entry) => sum + entry.value, 0) / Math.max(entries.length, 1);
  return {
    categories: entries.map((entry) => `${entry.type} (${entry.ref})`),
    series: [
      {
        name: 'Cp',
        data: entries.map((entry) => ({
          y: entry.value,
          color: entry.rangeValid ? undefined : CHART_THEME.greyedColor,
        })),
      },
    ],
    mean,
  };
}
