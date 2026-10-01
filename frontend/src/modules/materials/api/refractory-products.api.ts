import { api } from '@/shared/api/client';
import type { RefractoryProductQuery } from '../types/refractory-product-query.type';
import type { RefractoryProductResult } from '../types/refractory-product-result.type';
import type { RefractoryProductSummary } from '../types/refractory-product-summary.type';

export const refractoryProductsApi = {
  list: async (): Promise<RefractoryProductSummary[]> =>
    (await api.get<RefractoryProductSummary[]>('/refractory/refractories')).data,
  getProperties: async (query: RefractoryProductQuery): Promise<RefractoryProductResult> =>
    (await api.get<RefractoryProductResult>('/refractory/refractories/properties', { params: query })).data,
};
