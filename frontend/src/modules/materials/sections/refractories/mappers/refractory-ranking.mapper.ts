import type { CategorySeries } from '../../../../../components/charts';
import type { RefractoryProductResult } from '../../../types/refractory-product-result.type';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { toRefractorySeriesStyles } from './refractory-series-styles.mapper';

/** Products sorted by λ ascending (best insulator first) at the single chosen temperature. */
export function toRefractoryRanking(
  byMaterial: Record<string, RefractoryProductResult[]>,
  products: RefractoryProductSummary[],
): { categories: string[]; series: CategorySeries[] } {
  const styles = toRefractorySeriesStyles(Object.keys(byMaterial), products);
  const ranked = Object.entries(byMaterial)
    .filter(([, rows]) => rows.length > 0)
    .map(([materialId, rows]) => ({ materialId, lambda: rows[0].lambda_WmK }))
    .sort((a, b) => a.lambda - b.lambda);
  return {
    categories: ranked.map((entry) => styles[entry.materialId]?.name ?? entry.materialId),
    series: [
      {
        name: 'λ',
        data: ranked.map((entry) => ({ y: entry.lambda, color: styles[entry.materialId]?.color })),
      },
    ],
  };
}
