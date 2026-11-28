import { useQueries } from '@tanstack/react-query';
import { fluidPropertiesApi } from '../api/fluid-properties.api';
import { prandtlApi } from '../api/prandtl.api';
import { toPureGasRow } from '../mappers/pure-gas-row.mapper';
import type { FluidBaseInput } from '../types/fluid-base-input.type';
import type { FluidCpResult } from '../types/fluid-cp-result.type';
import type { PureGasPropertyRow } from '../types/pure-gas-property-row.type';
import type { PureGasRequest } from '../types/pure-gas-request.type';
import type { PureGasSpeciesRef } from '../types/pure-gas-species-ref.type';
import type { ScalarDimensionlessResult } from '../types/scalar-dimensionless-result.type';

function speciesKey(gas: PureGasSpeciesRef): string {
  return gas.source === 'registry' ? gas.key : gas.id;
}

function toFluidInput(
  gas: PureGasSpeciesRef,
  T_K: number,
  P_Pa: number,
  phase?: FluidBaseInput['phase'],
): FluidBaseInput {
  const base = { T_fluid_K: T_K, P_Pa, ...(phase ? { phase } : {}) };
  return gas.source === 'registry' ? { ...base, fluid: gas.key } : { ...base, compoundId: gas.id };
}

export function usePureGasProperties(request: PureGasRequest | null) {
  const phase = request?.phase;
  const points = request
    ? request.gases.flatMap((gas) =>
        request.temperatures_K.map((T_K) => ({ gas, T_K, P_Pa: request.P_Pa, key: speciesKey(gas) })),
      )
    : [];

  return useQueries({
    queries: points.flatMap(({ gas, T_K, P_Pa }) => {
      const input = toFluidInput(gas, T_K, P_Pa, phase);
      return [
        {
          queryKey: ['materials', 'gas-cp', speciesKey(gas), T_K, P_Pa, phase ?? 'gas'],
          queryFn: () => fluidPropertiesApi.cp(input),
          staleTime: Infinity,
          retry: false,
        },
        {
          queryKey: ['materials', 'gas-prandtl', speciesKey(gas), T_K, P_Pa, phase ?? 'gas'],
          queryFn: () => prandtlApi.calculate(input),
          staleTime: Infinity,
          retry: false,
        },
      ];
    }),
    combine: (results) => {
      const rows: PureGasPropertyRow[] = points.map((point, index) => {
        const cp = results[index * 2];
        const prandtl = results[index * 2 + 1];
        return toPureGasRow(
          point.key,
          point.T_K,
          cp.data as FluidCpResult | undefined,
          prandtl.data as ScalarDimensionlessResult | undefined,
          [cp.error, prandtl.error].filter(Boolean),
        );
      });
      const settled = results.length > 0 && results.every((result) => !result.isPending);
      return {
        rows,
        isLoading: results.some((result) => result.isLoading),
        isComplete: settled,
        allFailed: settled && results.every((result) => result.isError),
        firstError: results.find((result) => result.error)?.error ?? null,
      };
    },
  });
}
