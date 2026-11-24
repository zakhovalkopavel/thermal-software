import { useQuery } from '@tanstack/react-query';
import { refractoryProductsApi } from '../api/refractory-products.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useRefractoryProducts(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.refractories, queryFn: refractoryProductsApi.list, enabled, ...CATALOG_CACHE });
}
