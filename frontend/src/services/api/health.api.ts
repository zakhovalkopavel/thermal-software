import { api } from './client';
import type { HealthStatus } from './health-status.type';

export const healthApi = {
  get: async (): Promise<HealthStatus> => (await api.get<HealthStatus>('/health')).data,
};
