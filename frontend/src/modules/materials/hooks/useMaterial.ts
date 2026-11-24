import { useQuery } from '@tanstack/react-query';
import { materialLibraryApi } from '../api/material-library.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useMaterial(materialId: string | null | undefined) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.material(materialId),
    queryFn: () => materialLibraryApi.get(materialId as string),
    enabled: Boolean(materialId),
    ...CATALOG_CACHE,
  });
}
