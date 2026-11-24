import { useQueries } from '@tanstack/react-query';
import { callCombustion } from '../../../api/combustion-by-mode.api';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import type { CombustionRequest } from '../../../types/combustion-request.type';
import { toExcessAirGrid } from '../mappers/excess-air-grid.mapper';
import { toCombustionSummary } from '../mappers/combustion-summary.mapper';
import { withExcessAir } from '../mappers/sweep-request.mapper';
import type { ExcessAirSweepPoint } from '../types/excess-air-sweep-point.type';

/** Flame T and gas flow over the excess-air grid; `request` null = not requested. */
export function useExcessAirSweep(request: CombustionRequest | null) {
  const requests = request
    ? toExcessAirGrid().flatMap((kExcessAir) => {
        const swept = withExcessAir(request, kExcessAir);
        return swept ? [{ kExcessAir, swept }] : [];
      })
    : [];

  return useQueries({
    queries: requests.map(({ swept }) => ({
      queryKey: PROCESSES_QUERY_KEYS.combustion(swept.mode, swept.input),
      queryFn: () => callCombustion(swept),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      points: results.map((result, index): ExcessAirSweepPoint => {
        const summary = result.data ? toCombustionSummary(result.data) : undefined;
        return {
          kExcessAir: requests[index].kExcessAir,
          tFlame_K: summary?.tFlame_K,
          mGas_kgs: summary?.lastStep.mGas_kgs,
          error: result.error ?? undefined,
        };
      }),
      loading: results.some((result) => result.isLoading),
    }),
  });
}
