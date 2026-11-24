import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { htcApi } from '../api/htc.api';

export function useCorrelations() {
  return useQuery({ queryKey: PROCESSES_QUERY_KEYS.catalogue('correlations'), queryFn: htcApi.correlations, staleTime: Infinity });
}
