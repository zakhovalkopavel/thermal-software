import { useQueries } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { htcApi } from '../api/htc.api';
import type { DimensionlessInput } from '../types/dimensionless-input.type';
import type { VelocitySweepPoint } from '../types/velocity-sweep-point.type';

/** One dimensionless request per velocity; `input` null = not requested. */
export function useVelocitySweep(input: DimensionlessInput | null, velocities: number[]) {
  const requests = input ? velocities.map((w_m_s) => ({ w_m_s, input: { ...input, w_m_s, compareAll: false } })) : [];

  return useQueries({
    queries: requests.map((request) => ({
      queryKey: PROCESSES_QUERY_KEYS.calculation('dimensionless', request.input),
      queryFn: () => htcApi.dimensionless(request.input),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      points: results.map(
        (result, index): VelocitySweepPoint => ({ w_m_s: requests[index].w_m_s, result: result.data, error: result.error ?? undefined }),
      ),
      loading: results.some((result) => result.isLoading),
      failed: results.filter((result) => result.error).length,
    }),
  });
}
