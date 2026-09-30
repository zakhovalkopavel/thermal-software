import { useQuery } from '@tanstack/react-query';
import { thermalExchangeApi } from '../../../api/thermal-exchange.api';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import type { MultilayerWallInput } from '../../../types/multilayer-wall-input.type';

export function useMultilayerWall(input: MultilayerWallInput | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.multilayerWall(input),
    queryFn: () => thermalExchangeApi.multilayerWall(input as MultilayerWallInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
