import { api } from '../../../services/api/client';
import type { GasListEntry } from '../types/gas-list-entry.type';

export const gasesCatalogApi = {
  list: async (): Promise<GasListEntry[]> => (await api.get<GasListEntry[]>('/thermodynamics/fluid/list')).data,
};
