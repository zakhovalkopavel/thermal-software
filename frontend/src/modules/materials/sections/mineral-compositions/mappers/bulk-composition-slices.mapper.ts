import type { PieSlice } from '../../../../../components/charts';
import type { MixCompositionResult } from '../../../types/mix-composition-result.type';

const OTHER_OXIDES_LABEL = 'Other oxides';

/** Fired basis: accepted oxides, then other oxides (one slice) and each non-oxide group, hatched. */
export function toBulkCompositionSlices(result: MixCompositionResult, accepted: Record<string, number>): PieSlice[] {
  const otherOxides = Object.values(result.otherOxides_wt).reduce((sum, value) => sum + value, 0);
  return [
    ...Object.entries(accepted)
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([name, y]) => ({ name, y })),
    ...(otherOxides > 0 ? [{ name: OTHER_OXIDES_LABEL, y: otherOxides, hatched: true }] : []),
    ...Object.entries(result.nonOxideComponents_wt)
      .filter(([, value]) => (value ?? 0) > 0)
      .map(([name, value]) => ({ name, y: value ?? 0, hatched: true })),
  ];
}
