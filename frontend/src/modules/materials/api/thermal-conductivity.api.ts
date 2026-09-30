import { api } from '../../../services/api/client';
import type { ThermalConductivityInput } from '../types/thermal-conductivity-input.type';
import type { ThermalConductivityResult } from '../types/thermal-conductivity-result.type';

export const thermalConductivityApi = {
  calculate: async (input: ThermalConductivityInput): Promise<ThermalConductivityResult> =>
    (await api.post<ThermalConductivityResult>('/refractory/thermal-conductivity', input)).data,
};
