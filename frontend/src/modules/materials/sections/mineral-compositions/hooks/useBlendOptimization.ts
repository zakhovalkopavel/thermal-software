import { useQuery } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { blendOptimizationApi } from '../api/blend-optimization.api';
import type { BlendOptimizationInput } from '../types/blend-optimization-input.type';

export function useBlendOptimization(input: BlendOptimizationInput | null) {
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('blend-optimization', input),
    queryFn: () => blendOptimizationApi.optimize(input as BlendOptimizationInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
