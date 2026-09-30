import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { htcApi } from '../api/htc.api';

export function useFlowModes() {
  return useQuery({ queryKey: PROCESSES_QUERY_KEYS.catalogue('flow-modes'), queryFn: htcApi.flowModes, staleTime: Infinity });
}
