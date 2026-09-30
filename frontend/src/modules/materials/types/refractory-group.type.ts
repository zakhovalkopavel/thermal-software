import type { RefractoryProductSummary } from './refractory-product-summary.type';

export type RefractoryGroup = {
  key: string;
  label: string;
  color: string;
  products: RefractoryProductSummary[];
};
