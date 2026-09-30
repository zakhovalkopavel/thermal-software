import { useQueries } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { metalThermalApi } from '../api/metal-thermal.api';
import type { MetalPropertiesRequest } from '../types/metal-properties-request.type';
import type { MetalThermalResult } from '../types/metal-thermal-result.type';

export function useMetalProperties(request: MetalPropertiesRequest | null) {
  const pairs = request
    ? request.materials.flatMap((material) => request.temperatures_K.map((T_K) => ({ material, T_K })))
    : [];

  return useQueries({
    queries: pairs.map((query) => ({
      queryKey: MATERIALS_QUERY_KEYS.metalThermal(query.material, query.T_K),
      queryFn: () => metalThermalApi.getProperties(query),
      staleTime: Infinity,
    })),
    combine: (results) => {
      const byMaterial: Record<string, MetalThermalResult[]> = {};
      results.forEach((result, index) => {
        if (!result.data) return;
        (byMaterial[pairs[index].material] ??= []).push(result.data);
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
