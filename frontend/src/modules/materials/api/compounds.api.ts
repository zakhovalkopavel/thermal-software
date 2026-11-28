import { api } from '@/shared/api/client';
import type { CompoundGasBounds } from '../types/compound-gas-bounds.type';
import type { CompoundLiquidBounds } from '../types/compound-liquid-bounds.type';
import type { CompoundSearchHit } from '../types/compound-search-hit.type';

export const compoundsApi = {
  search: async (params: {
    q: string;
    limit?: number;
    gasesOnly?: boolean;
    liquidsOnly?: boolean;
  }): Promise<CompoundSearchHit[]> =>
    (
      await api.get<CompoundSearchHit[]>('/compounds/search', {
        params: {
          q: params.q,
          limit: params.limit ?? 20,
          gasesOnly: params.gasesOnly ?? false,
          liquidsOnly: params.liquidsOnly ?? false,
        },
      })
    ).data,

  gasBounds: async (id: string, P_Pa?: number): Promise<CompoundGasBounds> =>
    (
      await api.get<CompoundGasBounds>(`/compounds/${encodeURIComponent(id)}/gas-bounds`, {
        params: P_Pa != null ? { P_Pa } : undefined,
      })
    ).data,

  liquidBounds: async (id: string, P_Pa?: number): Promise<CompoundLiquidBounds> =>
    (
      await api.get<CompoundLiquidBounds>(`/compounds/${encodeURIComponent(id)}/liquid-bounds`, {
        params: P_Pa != null ? { P_Pa } : undefined,
      })
    ).data,
};
