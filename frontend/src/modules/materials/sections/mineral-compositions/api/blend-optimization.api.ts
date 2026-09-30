import { api } from '../../../../../services/api/client';
import type { BlendOptimizationInput } from '../types/blend-optimization-input.type';
import type { BlendResult } from '../types/blend-result.type';

export const blendOptimizationApi = {
  optimize: async (input: BlendOptimizationInput): Promise<BlendResult[]> =>
    (await api.post<BlendResult[]>('/refractory/blend-optimization', input)).data,
};
