import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { granulometryApi } from '../api/granulometry.api';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { toPsdFractions } from '../mappers/psd-fractions-request.mapper';
import type { CompleteMixFraction } from '../types/complete-mix-fraction.type';

const CALC = { staleTime: Infinity, retry: false, placeholderData: keepPreviousData } as const;

export function useGranulometry(fractions: CompleteMixFraction[], enabled: boolean, q: number, funkDingerDmin_mm: number | null) {
  const psdFractions = toPsdFractions(fractions);
  const andreasenInput = { fractions: psdFractions, q, Dmin_mm: MINERAL_COMPOSITIONS_UI.psd.andreasenDmin_mm };
  const funkDingerInput = { fractions: psdFractions, q, ...(funkDingerDmin_mm !== null ? { Dmin_mm: funkDingerDmin_mm } : {}) };
  const participationInput = {
    fractions: psdFractions.map(({ dMin_mm, dMax_mm, massFraction }) => ({ dMin_mm, dMax_mm, massFraction })),
  };

  const andreasen = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('psd/andreasen', andreasenInput),
    queryFn: () => granulometryApi.andreasen(andreasenInput),
    enabled,
    ...CALC,
  });
  const funkDinger = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('psd/funk-dinger', funkDingerInput),
    queryFn: () => granulometryApi.funkDinger(funkDingerInput),
    enabled,
    ...CALC,
  });
  const participation = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('participation', participationInput),
    queryFn: () => granulometryApi.participation(participationInput),
    enabled,
    ...CALC,
  });
  return { andreasen, funkDinger, participation };
}
