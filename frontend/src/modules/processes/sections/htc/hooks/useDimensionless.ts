import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { htcApi } from '../api/htc.api';
import type { DimensionlessInput } from '../types/dimensionless-input.type';

export function useDimensionless(input: DimensionlessInput | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.calculation('dimensionless', input),
    queryFn: () => htcApi.dimensionless(input as DimensionlessInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
