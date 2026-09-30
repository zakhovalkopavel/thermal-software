import { useQuery } from '@tanstack/react-query';
import { metalsCatalogApi } from '../api/metals-catalog.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useMetalList(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.metals, queryFn: metalsCatalogApi.list, enabled, ...CATALOG_CACHE });
}
