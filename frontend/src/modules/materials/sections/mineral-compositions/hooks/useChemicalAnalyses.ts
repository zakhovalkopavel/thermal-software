import { useQueries, useQuery } from '@tanstack/react-query';
import { thermalConductivityApi } from '../../../api/thermal-conductivity.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { chemistryApi } from '../api/chemistry.api';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import type { ChemicalRequest } from '../types/chemical-request.type';

const CALC = { staleTime: Infinity, retry: false } as const;

export function useChemicalAnalyses(request: ChemicalRequest | null) {
  const enabled = Boolean(request);
  const composition = request?.composition ?? {};
  const phaseInput = { composition, temperature: request?.temperature ?? 0, totalMass: request?.totalMass ?? 0 };
  const phase = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('phase-equilibrium', phaseInput),
    queryFn: () => chemistryApi.phaseEquilibrium(phaseInput),
    enabled,
    ...CALC,
  });

  const mineralInput = { composition, temperature: request?.temperature };
  const minerals = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('mineral-phases', mineralInput),
    queryFn: () => chemistryApi.mineralPhases(mineralInput),
    enabled,
    ...CALC,
  });

  const refractorinessInput = {
    composition,
    standard: request?.standard ?? 'ISO1893',
    testTemperature: request?.testTemperature ?? 0,
  } as const;
  const refractoriness = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.mineral('refractoriness', refractorinessInput),
    queryFn: () => chemistryApi.refractoriness(refractorinessInput),
    enabled,
    ...CALC,
  });

  const grid = request?.grid ?? [];
  const phaseSweep = useQueries({
    queries: grid.map((temperature) => {
      const input = { composition, temperature, totalMass: request?.totalMass ?? 0 };
      return {
        queryKey: MATERIALS_QUERY_KEYS.mineral('phase-equilibrium', input),
        queryFn: () => chemistryApi.phaseEquilibrium(input),
        enabled,
        ...CALC,
      };
    }),
  });

  const porosities = request ? [request.porosity, MINERAL_COMPOSITIONS_UI.chemistry.densePorosity] : [];
  const lambdaCalls = porosities.flatMap((porosity) =>
    [request?.temperature ?? 0, ...grid].map((temperature) => ({ composition, temperature, porosity })),
  );
  const lambda = useQueries({
    queries: lambdaCalls.map((input) => ({
      queryKey: MATERIALS_QUERY_KEYS.thermalConductivity(input),
      queryFn: () => thermalConductivityApi.calculate(input),
      enabled,
      ...CALC,
    })),
  });

  return {
    phase,
    minerals,
    refractoriness,
    phaseSweep: grid.map((temperature, index) => ({ temperature, result: phaseSweep[index]?.data, error: phaseSweep[index]?.error })),
    phaseSweepLoading: phaseSweep.some((query) => query.isLoading),
    lambda: lambdaCalls.map((input, index) => ({ ...input, result: lambda[index]?.data, error: lambda[index]?.error })),
    lambdaLoading: lambda.some((query) => query.isLoading),
  };
}
