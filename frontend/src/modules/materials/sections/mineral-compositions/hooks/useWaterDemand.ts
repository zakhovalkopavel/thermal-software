import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { waterShrinkageApi } from '../api/water-shrinkage.api';
import type { WaterDemandInput } from '../types/water-demand-input.type';
import type { Workability } from '../types/workability.type';

const CALC = { staleTime: Infinity, retry: false, placeholderData: keepPreviousData } as const;

export function useWaterDemand(packingFraction: number | null, workability: Workability, enabled: boolean) {
  const input: WaterDemandInput | null = packingFraction !== null ? { packingFraction, workability } : null;

  const demand = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('water-demand', input),
    queryFn: () => waterShrinkageApi.waterDemand(input as WaterDemandInput),
    enabled: enabled && input !== null,
    ...CALC,
  });
  const range = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('water-demand/range', packingFraction),
    queryFn: () => waterShrinkageApi.waterDemandRange(packingFraction as number),
    enabled: enabled && packingFraction !== null,
    ...CALC,
  });
  return { demand, range };
}
