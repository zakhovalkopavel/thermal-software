import { api } from '@/shared/api/client';
import type { RecuperatorInput } from '../types/recuperator-input.type';
import type { RecuperatorResult } from '../types/recuperator-result.type';

export const recuperatorApi = {
  calculate: async (input: RecuperatorInput): Promise<RecuperatorResult> =>
    (await api.post<RecuperatorResult>('/recuperator/calculate', input)).data,
};
