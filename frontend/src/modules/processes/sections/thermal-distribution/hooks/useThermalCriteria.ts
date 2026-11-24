import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { thermalDistributionApi } from '../api/thermal-distribution.api';
import type { ThermalRequest } from '../types/thermal-request.type';

export function useThermalCriteria(request: ThermalRequest | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.calculation('thermal-criteria', request),
    queryFn: () => thermalDistributionApi.criteria(request as ThermalRequest),
    enabled: request !== null,
    staleTime: Infinity,
    retry: false,
  });
}
