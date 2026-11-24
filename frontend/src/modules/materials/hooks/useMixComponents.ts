import { useQuery } from '@tanstack/react-query';
import { materialLibraryApi } from '../api/material-library.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useMixComponents(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.mixComponents, queryFn: materialLibraryApi.listMixComponents, enabled, ...CATALOG_CACHE });
}
