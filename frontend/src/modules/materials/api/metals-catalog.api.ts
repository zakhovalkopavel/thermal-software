import { api } from '../../../services/api/client';
import type { MetalSummary } from '../types/metal-summary.type';

export const metalsCatalogApi = {
  list: async (): Promise<MetalSummary[]> => (await api.get<MetalSummary[]>('/metals/list')).data,
};
