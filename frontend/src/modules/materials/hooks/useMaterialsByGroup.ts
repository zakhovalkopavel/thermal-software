import { useQuery } from '@tanstack/react-query';
import { materialLibraryApi } from '../api/material-library.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';
import type { MaterialGroupRoute } from '../types/material-group-route.type';

export function useMaterialsByGroup(route: MaterialGroupRoute) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.group(route),
    queryFn: () => materialLibraryApi.listByGroup(route),
    ...CATALOG_CACHE,
  });
}
