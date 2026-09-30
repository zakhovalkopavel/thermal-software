import type { CategorySeries } from '../../../../../components/charts';
import type { MaterialEntry } from '../../../types/material-entry.type';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import { toSizeLabel } from './size-label.mapper';

/** Categories = size fractions coarse → fine; one stacked series per material; y = mass %. */
export function toMixStructure(
  fractions: CompleteMixFraction[],
  components: Map<string, MaterialEntry>,
): { categories: string[]; series: CategorySeries[] } {
  const sizes = [...new Map(fractions.map((fraction) => [toSizeLabel(fraction), fraction])).values()].sort(
    (a, b) => b.dMax_mm - a.dMax_mm || b.dMin_mm - a.dMin_mm,
  );
  const categories = sizes.map(toSizeLabel);
  const materialIds = [...new Set(fractions.map((fraction) => fraction.materialId))];
  return {
    categories,
    series: materialIds.map((materialId) => ({
      name: components.get(materialId)?.name ?? materialId,
      stack: 'mix',
      data: categories.map((category) =>
        fractions
          .filter((fraction) => fraction.materialId === materialId && toSizeLabel(fraction) === category)
          .reduce<number | null>((sum, fraction) => (sum ?? 0) + fraction.massPercent, null),
      ),
    })),
  };
}
