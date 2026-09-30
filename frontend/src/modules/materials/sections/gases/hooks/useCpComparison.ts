import { useQuery } from '@tanstack/react-query';
import { cpComparisonApi } from '../api/cp-comparison.api';

export function useCpComparison(request: { species: string; T_K: number } | null) {
  return useQuery({
    queryKey: ['materials', 'cp-compare', request?.species, request?.T_K],
    queryFn: () => cpComparisonApi.compare(request!.species, request!.T_K),
    enabled: Boolean(request),
    staleTime: Infinity,
    retry: false,
  });
}
