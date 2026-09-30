import type { CategorySeries } from '../../../../../components/charts';

/** One stacked series per oxide over the glasses, oxides ordered by their largest content. */
export function toCompositionCompareBars(glasses: { name: string; composition: Record<string, number> }[]): {
  categories: string[];
  series: CategorySeries[];
} {
  const peak = new Map<string, number>();
  for (const glass of glasses) {
    for (const [oxide, value] of Object.entries(glass.composition)) {
      if (value > 0) peak.set(oxide, Math.max(peak.get(oxide) ?? 0, value));
    }
  }
  const oxides = [...peak.entries()].sort(([, a], [, b]) => b - a).map(([oxide]) => oxide);
  return {
    categories: glasses.map((glass) => glass.name),
    series: oxides.map((oxide) => ({ name: oxide, data: glasses.map((glass) => glass.composition[oxide] ?? 0) })),
  };
}
