import { useQueries } from '@tanstack/react-query';
import { refractoryProductsApi } from '../../../api/refractory-products.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import type { RefractoryProductResult } from '../../../types/refractory-product-result.type';
import type { RefractoryPropertiesRequest } from '../types/refractory-properties-request.type';

export function useRefractoryProperties(request: RefractoryPropertiesRequest | null) {
  const pairs = request
    ? request.materials.flatMap((material) => request.temperatures_K.map((T_K) => ({ material, T_K })))
    : [];

  return useQueries({
    queries: pairs.map((query) => ({
      queryKey: MATERIALS_QUERY_KEYS.refractoryProperties(query.material, query.T_K),
      queryFn: () => refractoryProductsApi.getProperties(query),
      staleTime: Infinity,
    })),
    combine: (results) => {
      const byMaterial: Record<string, RefractoryProductResult[]> = {};
      results.forEach((result, index) => {
        if (result.data) (byMaterial[pairs[index].material] ??= []).push(result.data);
      });
      return {
        byMaterial,
        isLoading: results.some((result) => result.isLoading),
        error: results.find((result) => result.error)?.error ?? null,
        isComplete: results.length > 0 && results.every((result) => result.isSuccess),
      };
    },
  });
}
