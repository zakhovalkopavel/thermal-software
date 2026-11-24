import { useQuery } from '@tanstack/react-query';
import { particleSizesApi } from '../api/particle-sizes.api';
import { CATALOG_CACHE } from '../constants/catalog-cache.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useParticleSizes(enabled = true) {
  return useQuery({ queryKey: MATERIALS_QUERY_KEYS.particleSizes, queryFn: particleSizesApi.get, enabled, ...CATALOG_CACHE });
}
