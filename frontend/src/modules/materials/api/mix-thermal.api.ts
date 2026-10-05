import { api } from '@/shared/api/client';
import type { MixThermalInput } from '../types/mix-thermal-input.type';
import type { MixThermalResult } from '../types/mix-thermal-result.type';

export const mixThermalApi = {
  calculate: async (input: MixThermalInput): Promise<MixThermalResult> =>
    (await api.post<MixThermalResult>('/refractory/mix/thermal', input)).data,
};
