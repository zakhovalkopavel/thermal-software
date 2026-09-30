import { api } from '../../../../../services/api/client';
import type { TemperatureProfileResult } from '../types/temperature-profile-result.type';
import type { TemperatureValueResult } from '../types/temperature-value-result.type';
import type { ThermalCriteria } from '../types/thermal-criteria.type';
import type { ThermalRequest } from '../types/thermal-request.type';

export const thermalDistributionApi = {
  criteria: async (request: ThermalRequest): Promise<ThermalCriteria> =>
    (await api.post<ThermalCriteria>('/thermal-distribution/criteria', request)).data,
  atDepth: async (request: ThermalRequest & { relDepth: number }): Promise<TemperatureValueResult> =>
    (await api.post<TemperatureValueResult>('/thermal-distribution/temperature/at-depth', request)).data,
  profile: async (request: ThermalRequest & { relativeDepths: number[] }): Promise<TemperatureProfileResult> =>
    (await api.post<TemperatureProfileResult>('/thermal-distribution/temperature/profile', request)).data,
  average: async (request: ThermalRequest): Promise<TemperatureValueResult> =>
    (await api.post<TemperatureValueResult>('/thermal-distribution/temperature/average', request)).data,
};
