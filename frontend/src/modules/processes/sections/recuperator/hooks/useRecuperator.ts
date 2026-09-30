import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { recuperatorApi } from '../api/recuperator.api';
import type { RecuperatorInput } from '../types/recuperator-input.type';

export function useRecuperator(input: RecuperatorInput | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.calculation('recuperator', input),
    queryFn: () => recuperatorApi.calculate(input as RecuperatorInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
