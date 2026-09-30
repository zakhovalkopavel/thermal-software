import { useQuery } from '@tanstack/react-query';
import { materialLibraryApi } from '../api/material-library.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';
import type { MaterialListQuery } from '../types/material-list-query.type';

export function useMaterialLibrary(query: MaterialListQuery) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.library(query),
    queryFn: () => materialLibraryApi.list(query),
    ...CATALOG_CACHE,
  });
}
