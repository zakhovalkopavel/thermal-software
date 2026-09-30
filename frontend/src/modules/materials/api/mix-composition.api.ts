import { api } from '../../../services/api/client';
import type { MixCompositionInput } from '../types/mix-composition-input.type';
import type { MixCompositionResult } from '../types/mix-composition-result.type';

export const mixCompositionApi = {
  calculate: async (input: MixCompositionInput): Promise<MixCompositionResult> =>
    (await api.post<MixCompositionResult>('/refractory/mix/composition', input)).data,
};
