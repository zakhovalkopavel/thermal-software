import { Highcharts } from '@/shared/ui/charts';
import { toRefractoryGroups } from '../../../mappers/refractory-groups.mapper';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import { REFRACTORIES_UI } from '../constants/refractories-ui.constants';
import type { RefractorySeriesStyle } from '../types/refractory-series-style.type';

/** Name and colour per selected product: the group colour, brightened for each further product of the same group. */
export function toRefractorySeriesStyles(
  materialIds: string[],
  products: RefractoryProductSummary[],
): Record<string, RefractorySeriesStyle> {
  const selected = products.filter((product) => materialIds.includes(product.materialId));
  const styles: Record<string, RefractorySeriesStyle> = {};
  for (const group of toRefractoryGroups(selected)) {
    group.products.forEach((product, index) => {
      styles[product.materialId] = {
        name: product.name,
        color: Highcharts.color(group.color).brighten(index * REFRACTORIES_UI.shadeStep).get('rgb') as string,
      };
    });
  }
  return styles;
}
