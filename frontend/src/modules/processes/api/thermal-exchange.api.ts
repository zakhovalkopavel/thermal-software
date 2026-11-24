import { api } from '@/shared/api/client';
import type { MultilayerWallInput } from '../types/multilayer-wall-input.type';
import type { MultilayerWallResult } from '../types/multilayer-wall-result.type';

export const thermalExchangeApi = {
  multilayerWall: async (input: MultilayerWallInput): Promise<MultilayerWallResult> =>
    (await api.post<MultilayerWallResult>('/thermal-exchange/multilayer-wall', input)).data,
};
