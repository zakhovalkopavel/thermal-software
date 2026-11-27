import { useQueries, useQuery } from '@tanstack/react-query';
import { mixThermalApi } from '../../../api/mix-thermal.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { chemistryApi } from '../api/chemistry.api';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { toMixFractions } from '../mappers/mix-fractions-request.mapper';
import { toPhaseEquilibriumInput } from '../mappers/phase-equilibrium-request.mapper';
import type { ChemicalRequest } from '../types/chemical-request.type';

const CALC = { staleTime: Infinity, retry: false } as const;

const uniqueSorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

export function useChemicalAnalyses(request: ChemicalRequest | null) {
  const enabled = Boolean(request);
  const composition = request?.composition ?? {};
  const hasOxides = Object.keys(composition).length > 0;
  const phaseInput = toPhaseEquilibriumInput(request, request?.temperature ?? 0);
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
    enabled: enabled && hasOxides,
    ...CALC,
  });

  const grid = request?.grid ?? [];
  const phaseSweep = useQueries({
    queries: grid.map((temperature) => {
      const input = toPhaseEquilibriumInput(request, temperature);
      return {
        queryKey: MATERIALS_QUERY_KEYS.mineral('phase-equilibrium', input),
        queryFn: () => chemistryApi.phaseEquilibrium(input),
        enabled,
        ...CALC,
      };
    }),
  });

  const mixFractions = request ? toMixFractions(request.fractions) : [];
  const temperatures_C = request ? uniqueSorted([request.temperature, ...request.grid]) : [];
  const porosities = request
    ? uniqueSorted([request.porosity, MINERAL_COMPOSITIONS_UI.chemistry.densePorosity])
    : [];
  const lambda = useQueries({
    queries: porosities.map((porosity) => {
      const input = { fractions: mixFractions, temperatures_C, porosity };
      return {
        queryKey: MATERIALS_QUERY_KEYS.mixThermal(input),
        queryFn: () => mixThermalApi.calculate(input),
        enabled,
        ...CALC,
      };
    }),
  });

  return {
    phase,
    minerals,
    phaseSweep: grid.map((temperature, index) => ({ temperature, result: phaseSweep[index]?.data, error: phaseSweep[index]?.error })),
    phaseSweepLoading: phaseSweep.some((query) => query.isLoading),
    lambda: porosities.map((porosity, index) => ({
      porosity,
      result: lambda[index]?.data,
      error: lambda[index]?.error,
    })),
    lambdaLoading: lambda.some((query) => query.isLoading),
  };
}
