import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { packingApi } from '../api/packing.api';
import { toPackingArrays } from '../mappers/packing-request.mapper';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';
import type { PackingCpmInput } from '../types/packing-cpm-input.type';
import type { PackingFurnasInput } from '../types/packing-furnas-input.type';

const CALC = { staleTime: Infinity, retry: false, placeholderData: keepPreviousData } as const;

export function usePacking(
  fractions: CompleteMixFraction[],
  enabled: boolean,
  compactionPressure_MPa: number | null,
  efficiencyFactor: number | null,
) {
  const arrays = toPackingArrays(fractions);
  const cpmInput: PackingCpmInput = {
    ...arrays,
    ...(compactionPressure_MPa !== null ? { compactionPressure_MPa } : {}),
  };
  const furnasInput: PackingFurnasInput = {
    ...arrays,
    ...(efficiencyFactor !== null ? { efficiencyFactor } : {}),
  };

  const cpm = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('packing/cpm', cpmInput),
    queryFn: () => packingApi.cpm(cpmInput),
    enabled,
    ...CALC,
  });
  const furnas = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('packing/furnas', furnasInput),
    queryFn: () => packingApi.furnas(furnasInput),
    enabled,
    ...CALC,
  });
  return { cpm, furnas };
}
