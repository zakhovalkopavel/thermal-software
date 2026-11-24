import { api } from '@/shared/api/client';
import type { FluidBaseInput } from '../types/fluid-base-input.type';
import type { FluidCpResult } from '../types/fluid-cp-result.type';

export const fluidPropertiesApi = {
  cp: async (input: FluidBaseInput): Promise<FluidCpResult> =>
    (await api.post<FluidCpResult>('/thermodynamics/fluid/cp', input)).data,
};
