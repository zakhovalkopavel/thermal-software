import { useQuery } from '@tanstack/react-query';
import { combustionApi } from '../api/combustion.api';
import { PROCESSES_QUERY_KEYS } from '../constants/processes-query-keys.constants';

export function useFuels() {
  return useQuery({ queryKey: PROCESSES_QUERY_KEYS.fuels, queryFn: combustionApi.fuels, staleTime: Infinity });
}
