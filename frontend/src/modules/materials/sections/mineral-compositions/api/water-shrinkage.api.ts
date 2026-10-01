import { api } from '@/shared/api/client';
import type { ShrinkageInput } from '../types/shrinkage-input.type';
import type { ShrinkageResult } from '../types/shrinkage-result.type';
import type { WaterDemandInput } from '../types/water-demand-input.type';
import type { WaterDemandRangeResult } from '../types/water-demand-range-result.type';
import type { WaterDemandResult } from '../types/water-demand-result.type';

export const waterShrinkageApi = {
  waterDemand: async (input: WaterDemandInput): Promise<WaterDemandResult> =>
    (await api.post<WaterDemandResult>('/refractory/water-demand', input)).data,
  waterDemandRange: async (packingFraction: number): Promise<WaterDemandRangeResult> =>
    (await api.post<WaterDemandRangeResult>('/refractory/water-demand/range', { packingFraction })).data,
  shrinkage: async (input: ShrinkageInput): Promise<ShrinkageResult> =>
    (await api.post<ShrinkageResult>('/refractory/shrinkage', input)).data,
};
