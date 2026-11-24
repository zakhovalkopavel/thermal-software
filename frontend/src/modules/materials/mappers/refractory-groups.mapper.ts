import { REFRACTORY_GROUPS } from '../constants/refractory-groups.constants';
import { REFRACTORY_OTHER_GROUP } from '../constants/refractory-other-group.constants';
import type { RefractoryGroup } from '../types/refractory-group.type';
import type { RefractoryProductSummary } from '../types/refractory-product-summary.type';

export function toRefractoryGroups(products: RefractoryProductSummary[]): RefractoryGroup[] {
  const groups: RefractoryGroup[] = [...REFRACTORY_GROUPS, REFRACTORY_OTHER_GROUP].map((group) => ({
    key: group.key,
    label: group.label,
    color: group.color,
    products: [],
  }));
  const other = groups[groups.length - 1];
  for (const product of products) {
    const index = REFRACTORY_GROUPS.findIndex((group) =>
      group.idPrefixes.some((prefix) => product.materialId.startsWith(prefix)),
    );
    (index >= 0 ? groups[index] : other).products.push(product);
  }
  return groups.filter((group) => group.products.length > 0);
}
