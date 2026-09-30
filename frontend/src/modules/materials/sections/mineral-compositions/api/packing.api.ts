import { api } from '../../../../../services/api/client';
import type { PackingCpmInput } from '../types/packing-cpm-input.type';
import type { PackingFurnasInput } from '../types/packing-furnas-input.type';
import type { PackingResult } from '../types/packing-result.type';

export const packingApi = {
  cpm: async (input: PackingCpmInput): Promise<PackingResult> =>
    (await api.post<PackingResult>('/refractory/packing/cpm', input)).data,
  furnas: async (input: PackingFurnasInput): Promise<PackingResult> =>
    (await api.post<PackingResult>('/refractory/packing/furnas', input)).data,
};
