import { api } from '@/shared/api/client';
import type { PrandtlInput } from '../types/prandtl-input.type';
import type { ScalarDimensionlessResult } from '../types/scalar-dimensionless-result.type';

export const prandtlApi = {
  calculate: async (input: PrandtlInput): Promise<ScalarDimensionlessResult> =>
    (await api.post<ScalarDimensionlessResult>('/thermodynamics/dimensionless/prandtl', input)).data,
};
