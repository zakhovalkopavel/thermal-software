import type { RefractoryProductResult } from '../../../types/refractory-product-result.type';
import type { RefractoryProductSummary } from '../../../types/refractory-product-summary.type';
import type { RefractoryPropertiesRequest } from './refractory-properties-request.type';

export type RefractoryResultsProps = {
  request: RefractoryPropertiesRequest;
  products: RefractoryProductSummary[];
  byMaterial: Record<string, RefractoryProductResult[]>;
};
