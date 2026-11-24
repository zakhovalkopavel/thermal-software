import { useQuery } from '@tanstack/react-query';
import { materialLibraryApi } from '../api/material-library.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useMaterialGroups(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.groups, queryFn: materialLibraryApi.listGroups, enabled, ...CATALOG_CACHE });
}
