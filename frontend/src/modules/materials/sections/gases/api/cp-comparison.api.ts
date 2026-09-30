import { api } from '../../../../../services/api/client';
import type { CpComparisonEntry } from '../types/cp-comparison-entry.type';

export const cpComparisonApi = {
  compare: async (species: string, T_K: number): Promise<CpComparisonEntry[]> =>
    (await api.get<CpComparisonEntry[]>('/thermodynamics/cp-compare', { params: { species, T_K } })).data,
};
