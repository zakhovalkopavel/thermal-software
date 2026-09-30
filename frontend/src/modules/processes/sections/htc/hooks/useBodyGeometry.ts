import { useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { htcApi } from '../api/htc.api';
import type { BodyGeometryInput } from '../types/body-geometry-input.type';

export function useBodyGeometry(input: BodyGeometryInput | null) {
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.calculation('body-geometry', input),
    queryFn: () => htcApi.bodyGeometry(input as BodyGeometryInput),
    enabled: input !== null,
    staleTime: Infinity,
    retry: false,
  });
}
