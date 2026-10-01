import { useQueries, useQuery } from '@tanstack/react-query';
import { compositionApi } from '@/shared/api/composition.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { glassViscosityApi } from '../api/glass-viscosity.api';
import type { GlassCalculationRequest } from '../types/glass-calculation-request.type';

const convertQuery = (composition: Record<string, number>, direction: 'wt_to_mol' | 'mol_to_wt', enabled: boolean) => ({
  queryKey: MATERIALS_QUERY_KEYS.compositionConvert(composition, direction),
  queryFn: () => compositionApi.convert(composition, direction),
  enabled,
  staleTime: Infinity,
  retry: false,
});

export function useGlassCalculation(request: GlassCalculationRequest | null) {
  const composition = request?.composition ?? {};
  const direction = request?.unit === 'mol' ? 'mol_to_wt' : 'wt_to_mol';
  const converted = useQuery(convertQuery(composition, direction, Boolean(request)));

  const wt = request?.unit === 'wt' ? request.composition : converted.data?.output;
  const mol = request?.unit === 'mol' ? request.composition : converted.data?.output;
  const model = request?.model ?? undefined;
  const ready = Boolean(request && wt);

  const atTemperatureInput =
    request?.task === 'at-temperature' && wt && request.temperature_C !== null
      ? { composition: wt, temperature: request.temperature_C, model }
      : null;
  const atTemperature = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.glassViscosity(atTemperatureInput),
    queryFn: () => glassViscosityApi.viscosity(atTemperatureInput!),
    enabled: Boolean(atTemperatureInput),
    staleTime: Infinity,
    retry: false,
  });

  const atViscosityInput =
    request?.task === 'temperature-at-viscosity' && wt && request.targetLogEta !== null
      ? { composition: wt, targetLogEta: request.targetLogEta, model }
      : null;
  const atViscosity = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.glassTemperatureAtViscosity(atViscosityInput),
    queryFn: () => glassViscosityApi.temperatureAtViscosity(atViscosityInput!),
    enabled: Boolean(atViscosityInput),
    staleTime: Infinity,
    retry: false,
  });

  const profileInput = request && wt ? { composition: wt, temperatures_C: request.grid, model } : null;
  const userProfile = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.glassProfile(profileInput),
    queryFn: () => glassViscosityApi.profile(profileInput!),
    enabled: Boolean(profileInput),
    staleTime: Infinity,
    retry: false,
  });

  const references = request?.references ?? [];
  const referenceProfiles = useQueries({
    queries: references.map((reference) => ({
      queryKey: MATERIALS_QUERY_KEYS.glassReferenceProfile(reference.materialId, request?.grid ?? [], request?.model ?? null),
      queryFn: () =>
        glassViscosityApi.profile({ composition: reference.composition, temperatures_C: request?.grid ?? [], model }),
      enabled: ready,
      staleTime: Infinity,
      retry: false,
    })),
  });

  const referencesMol = useQueries({
    queries: references.map((reference) => convertQuery(reference.composition, 'wt_to_mol', request?.unit === 'mol')),
  });

  const taskQuery =
    request?.task === 'at-temperature' ? atTemperature : request?.task === 'temperature-at-viscosity' ? atViscosity : null;
  const blocking = [converted, userProfile, ...(taskQuery ? [taskQuery] : [])];

  return {
    wt,
    mol,
    atTemperature: atTemperature.data,
    atViscosity: atViscosity.data,
    userProfile: userProfile.data,
    references: references.map((reference, index) => ({
      reference,
      profile: referenceProfiles[index]?.data,
      error: referenceProfiles[index]?.error ?? null,
      mol: referencesMol[index]?.data?.output,
    })),
    isLoading: blocking.some((query) => query.isLoading) || referenceProfiles.some((query) => query.isLoading),
    error: blocking.find((query) => query.error)?.error ?? null,
    isComplete: Boolean(request) && blocking.every((query) => query.isSuccess),
  };
}
