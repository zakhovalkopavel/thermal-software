import { api } from '@/shared/api/client';
import type { CompoundGasBounds } from '../types/compound-gas-bounds.type';
import type { CompoundSearchHit } from '../types/compound-search-hit.type';

export const compoundsApi = {
  search: async (params: {
    q: string;
    limit?: number;
    gasesOnly?: boolean;
  }): Promise<CompoundSearchHit[]> =>
    (
      await api.get<CompoundSearchHit[]>('/compounds/search', {
        params: {
          q: params.q,
          limit: params.limit ?? 20,
          gasesOnly: params.gasesOnly ?? false,
        },
      })
    ).data,

  gasBounds: async (id: string, P_Pa?: number): Promise<CompoundGasBounds> =>
    (
      await api.get<CompoundGasBounds>(`/compounds/${encodeURIComponent(id)}/gas-bounds`, {
        params: P_Pa != null ? { P_Pa } : undefined,
      })
    ).data,
};
