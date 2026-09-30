import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { mixCompositionApi } from '../../../api/mix-composition.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import type { MixCompositionInput } from '../../../types/mix-composition-input.type';
import { MIX_COMPOSITION_UI } from '../constants/mix-composition-ui.constants';
import { toMixCompositionInput } from '../mappers/mix-composition-request.mapper';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';

export function useMixComposition(fractions: CompleteMixFraction[]) {
  const debouncedKey = useDebouncedValue(JSON.stringify(toMixCompositionInput(fractions)), MIX_COMPOSITION_UI.debounce_ms);
  const input = useMemo(() => JSON.parse(debouncedKey) as MixCompositionInput | null, [debouncedKey]);
  return useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mixComposition(input),
    queryFn: () => mixCompositionApi.calculate(input!),
    enabled: Boolean(input),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });
}
