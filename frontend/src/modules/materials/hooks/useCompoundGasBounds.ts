import { useQuery } from '@tanstack/react-query';
import { compoundsApi } from '../api/compounds.api';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useCompoundGasBounds(id: string | null, P_Pa: number | null, enabled = true) {
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEYS.compoundGasBounds, id, P_Pa],
    queryFn: () => compoundsApi.gasBounds(id as string, P_Pa ?? undefined),
    enabled: enabled && Boolean(id) && P_Pa != null && P_Pa > 0,
    staleTime: 60_000,
  });
}
