import { api } from '../../../../../services/api/client';
import type { ParticipationInput } from '../types/participation-input.type';
import type { ParticipationResult } from '../types/participation-result.type';
import type { PsdInput } from '../types/psd-input.type';
import type { PsdResult } from '../types/psd-result.type';

export const granulometryApi = {
  andreasen: async (input: PsdInput): Promise<PsdResult> =>
    (await api.post<PsdResult>('/refractory/psd/andreasen', input)).data,
  funkDinger: async (input: PsdInput): Promise<PsdResult> =>
    (await api.post<PsdResult>('/refractory/psd/funk-dinger', input)).data,
  participation: async (input: ParticipationInput): Promise<ParticipationResult> =>
    (await api.post<ParticipationResult>('/refractory/participation', input)).data,
};
