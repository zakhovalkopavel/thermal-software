import { useQueries } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { thermalDistributionApi } from '../api/thermal-distribution.api';
import type { ThermalRequest } from '../types/thermal-request.type';
import type { TimedProfile } from '../types/timed-profile.type';

/** One profile request per τ, in parallel. */
export function useTemperatureProfiles(request: ThermalRequest, taus: number[], depths: number[]) {
  const bodies = taus.map((tau) => ({ ...request, tau, relativeDepths: depths }));
  return useQueries({
    queries: bodies.map((body) => ({
      queryKey: PROCESSES_QUERY_KEYS.calculation('thermal-profile', body),
      queryFn: () => thermalDistributionApi.profile(body),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      profiles: results.map((result, index): TimedProfile => ({ tau: taus[index], temperatures: result.data?.temperatures, error: result.error ?? undefined })),
      loading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });
}
