import { useQueries } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { thermalDistributionApi } from '../api/thermal-distribution.api';
import type { AverageSweepPoint } from '../types/average-sweep-point.type';
import type { ThermalRequest } from '../types/thermal-request.type';

/** Volume-average T at each τ, in parallel. */
export function useAverageSweep(request: ThermalRequest, taus: number[]) {
  const bodies = taus.map((tau) => ({ ...request, tau }));
  return useQueries({
    queries: bodies.map((body) => ({
      queryKey: PROCESSES_QUERY_KEYS.calculation('thermal-average', body),
      queryFn: () => thermalDistributionApi.average(body),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      points: results.map((result, index): AverageSweepPoint => ({ tau: taus[index], temperature: result.data?.temperature, error: result.error ?? undefined })),
      loading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });
}
