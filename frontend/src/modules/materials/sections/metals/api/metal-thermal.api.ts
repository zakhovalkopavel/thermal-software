import { api } from '@/shared/api/client';
import type { MetalThermalQuery } from '../types/metal-thermal-query.type';
import type { MetalThermalResult } from '../types/metal-thermal-result.type';

export const metalThermalApi = {
  getProperties: async (query: MetalThermalQuery): Promise<MetalThermalResult> =>
    (await api.get<MetalThermalResult>('/metals/thermal-properties', { params: query })).data,
};
