import { useQuery } from '@tanstack/react-query';
import { callCombustion } from '../../../api/combustion-by-mode.api';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import type { CombustionRequest } from '../../../types/combustion-request.type';

export function useCombustion(request: CombustionRequest | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.combustion(request?.mode ?? 'none', request?.input ?? null),
    queryFn: () => callCombustion(request as CombustionRequest),
    enabled: request !== null,
    staleTime: Infinity,
    retry: false,
  });
}
