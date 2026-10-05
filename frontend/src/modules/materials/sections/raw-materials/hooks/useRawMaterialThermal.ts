import { useQueries } from '@tanstack/react-query';
import { mixThermalApi } from '../../../api/mix-thermal.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import type { MixThermalResult } from '../../../types/mix-thermal-result.type';
import { RAW_MATERIALS_UI } from '../constants/raw-materials-ui.constants';
import { toMixThermalRequest } from '../mappers/mix-thermal-request.mapper';
import { toRawMaterialThermalPoints } from '../mappers/raw-material-thermal-points.mapper';
import type { RawMaterialThermalRequest } from '../types/raw-material-thermal-request.type';

export function useRawMaterialThermal(request: RawMaterialThermalRequest | null) {
  const calls = request
    ? request.materialIds.flatMap((materialId, index) => {
        const porosities =
          index === 0 && request.includeDense ? [request.porosity, RAW_MATERIALS_UI.densePorosity] : [request.porosity];
        return porosities.map((porosity) => ({
          materialId,
          input: toMixThermalRequest(materialId, request.temperatures_C, porosity),
        }));
      })
    : [];

  return useQueries({
    queries: calls.map((call) => ({
      queryKey: MATERIALS_QUERY_KEYS.mixThermal(call.input),
      queryFn: () => mixThermalApi.calculate(call.input),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      points: results.flatMap((result, index) =>
        result.data ? toRawMaterialThermalPoints(calls[index].materialId, result.data) : [],
      ),
      /** Result at the requested porosity, per material. */
      results: Object.fromEntries(
        results.flatMap((result, index): Array<[string, MixThermalResult]> =>
          result.data && calls[index].input.porosity === request?.porosity ? [[calls[index].materialId, result.data]] : [],
        ),
      ) as Record<string, MixThermalResult>,
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
      isComplete: calls.length > 0 && results.every((result) => result.isSuccess),
    }),
  });
}
