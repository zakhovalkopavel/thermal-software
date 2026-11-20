import { useQueries } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { metalThermalApi } from '../api/metal-thermal.api';
import { isOutsideDomainError } from '../mappers/is-outside-domain-error.mapper';
import type { MetalPropertiesRequest } from '../types/metal-properties-request.type';
import type { MetalThermalResult } from '../types/metal-thermal-result.type';

export function useMetalProperties(request: MetalPropertiesRequest | null) {
  const pairs = request
    ? request.materials.flatMap((material) => request.temperatures_K.map((T_K) => ({ material, T_K })))
    : [];

  return useQueries({
    queries: pairs.map((query) => ({
      queryKey: MATERIALS_QUERY_KEYS.metalThermal(query.material, query.T_K),
      queryFn: async (): Promise<MetalThermalResult | null> => {
        try {
          return await metalThermalApi.getProperties(query);
        } catch (error) {
          // Legacy backends still 400 on out-of-domain T; skip those points.
          if (isOutsideDomainError(error)) return null;
          throw error;
        }
      },
      staleTime: Infinity,
    })),
    combine: (results) => {
      const byMaterial: Record<string, MetalThermalResult[]> = {};
      let skippedOutsideDomain = 0;
      results.forEach((result, index) => {
        if (result.data === null) {
          skippedOutsideDomain += 1;
          return;
        }
        if (!result.data) return;
        (byMaterial[pairs[index].material] ??= []).push(result.data);
      });
      const hardError = results.find((result) => result.isError)?.error ?? null;
      return {
        byMaterial,
        skippedOutsideDomain,
        isLoading: results.some((result) => result.isLoading),
        error: hardError,
        isComplete: results.length > 0 && results.every((result) => result.isSuccess),
      };
    },
  });
}
