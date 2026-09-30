import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PROCESSES_QUERY_KEYS } from '../../../constants/processes-query-keys.constants';
import { thermalDistributionApi } from '../api/thermal-distribution.api';
import { THERMAL_UI } from '../constants/thermal-ui.constants';
import type { ThermalRequest } from '../types/thermal-request.type';

export function useTemperatureAtDepth(request: ThermalRequest, relDepth: number | null) {
  const valid = relDepth !== null && relDepth >= THERMAL_UI.relDepth.min && relDepth <= THERMAL_UI.relDepth.max;
  const body = { ...request, relDepth: relDepth ?? THERMAL_UI.relDepth.default };
  return useQuery({
    queryKey: PROCESSES_QUERY_KEYS.calculation('thermal-at-depth', body),
    queryFn: () => thermalDistributionApi.atDepth(body),
    enabled: valid,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });
}
