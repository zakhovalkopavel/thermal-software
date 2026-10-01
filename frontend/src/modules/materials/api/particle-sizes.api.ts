import { api } from '@/shared/api/client';
import type { ParticleSizes } from '../types/particle-sizes.type';

export const particleSizesApi = {
  get: async (): Promise<ParticleSizes> => (await api.get<ParticleSizes>('/refractory/particle-sizes')).data,
};
