import { api } from './client';
import type { ConvertCompositionResult } from './types/convert-composition-result.type';

export const compositionApi = {
  convert: async (
    composition: Record<string, number>,
    direction: ConvertCompositionResult['direction'],
  ): Promise<ConvertCompositionResult> =>
    (await api.post<ConvertCompositionResult>('/refractory/utils/convert-composition', { composition, direction })).data,
};
