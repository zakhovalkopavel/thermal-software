import type { RefractoryProductResult } from '../../../types/refractory-product-result.type';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';

export type RefractoryChartProps = {
  products: RefractoryProductSummary[];
  byMaterial: Record<string, RefractoryProductResult[]>;
};
