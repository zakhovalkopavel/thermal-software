import { useQuery } from '@tanstack/react-query';
import { gasesCatalogApi } from '../api/gases-catalog.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useGasList(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.gases, queryFn: gasesCatalogApi.list, enabled, ...CATALOG_CACHE });
}
