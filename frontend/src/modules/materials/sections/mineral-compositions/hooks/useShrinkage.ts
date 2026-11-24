import { useQuery } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { waterShrinkageApi } from '../api/water-shrinkage.api';
import type { ShrinkageInput } from '../types/shrinkage-input.type';

export function useShrinkage(input: ShrinkageInput | null) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('shrinkage', input),
    queryFn: () => waterShrinkageApi.shrinkage(input as ShrinkageInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
