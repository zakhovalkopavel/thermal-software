import { useQueries } from '@tanstack/react-query';
import { thermalConductivityApi } from '../../../api/thermal-conductivity.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import type { MixCompositionResult } from '../../../types/mix-composition-result.type';
import { RAW_MATERIALS_UI } from '../constants/raw-materials-ui.constants';
import { toThermalConductivityRequest } from '../mappers/thermal-conductivity-request.mapper';
import type { RawMaterialThermalPoint } from '../types/raw-material-thermal-point.type';
import type { RawMaterialThermalRequest } from '../types/raw-material-thermal-request.type';
import { singleMaterialCompositionQuery } from './single-material-composition.query';

export function useRawMaterialThermal(request: RawMaterialThermalRequest | null) {
  const materialIds = request?.materialIds ?? [];
  const compositionResults = useQueries({ queries: materialIds.map(singleMaterialCompositionQuery) });

  const compositions: Record<string, MixCompositionResult> = {};
  compositionResults.forEach((result, index) => {
    if (result.data) compositions[materialIds[index]] = result.data;
  });

  const calls = request
    ? materialIds.flatMap((materialId, index) => {
        const normalized = compositions[materialId]?.acceptedOxides_normalized;
        if (!normalized || Object.keys(normalized).length === 0) return [];
        const porosities =
          index === 0 && request.includeDense ? [request.porosity, RAW_MATERIALS_UI.densePorosity] : [request.porosity];
        return porosities.flatMap((porosity) =>
          request.temperatures_C.map((temperature_C) => ({
            materialId,
            input: toThermalConductivityRequest(normalized, temperature_C, porosity),
          })),
        );
      })
    : [];

  const thermal = useQueries({
    queries: calls.map((call) => ({
      queryKey: MATERIALS_QUERY_KEYS.thermalConductivity(call.input),
      queryFn: () => thermalConductivityApi.calculate(call.input),
      staleTime: Infinity,
    })),
    combine: (results) => ({
      points: results.flatMap((result, index): RawMaterialThermalPoint[] =>
        result.data
          ? [
              {
                materialId: calls[index].materialId,
                temperature_C: result.data.temperature_C,
                porosity: result.data.porosity,
                lambda_WmK: result.data.thermalConductivity_WmK,
                cp_JkgK: result.data.specificHeat_JkgK,
                rho_kgm3: result.data.density_kgm3,
                diffusivity_m2s: result.data.thermalDiffusivity_m2s,
              },
            ]
          : [],
      ),
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
      isComplete: results.every((result) => result.isSuccess),
    }),
  });

  const compositionsLoading = compositionResults.some((result) => result.isLoading);
  return {
    compositions,
    points: thermal.points,
    isLoading: compositionsLoading || thermal.isLoading,
    error: compositionResults.find((result) => result.error)?.error ?? thermal.error,
    isComplete:
      materialIds.length > 0 &&
      compositionResults.every((result) => result.isSuccess) &&
      thermal.isComplete,
  };
}
