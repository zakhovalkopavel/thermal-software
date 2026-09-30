import { useQueries } from '@tanstack/react-query';
import { gasMixtureApi } from '../api/gas-mixture.api';
import type { GasMixtureRequest } from '../types/gas-mixture-request.type';
import type { GasMixtureRow } from '../types/gas-mixture-row.type';

export function useGasMixtureProperties(request: GasMixtureRequest | null) {
  const temperatures = request?.temperatures_K ?? [];

  return useQueries({
    queries: temperatures.map((T_K) => ({
      queryKey: ['materials', 'gas-mixture', request?.composition, request?.fractionType, request?.P_atm, T_K],
      queryFn: () =>
        gasMixtureApi.getProperties({
          composition: request!.composition,
          fractionType: request!.fractionType,
          P_atm: request!.P_atm,
          T_K,
        }),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (results) => ({
      rows: results.flatMap((result, index): GasMixtureRow[] =>
        result.data ? [{ ...result.data, T_K: temperatures[index] }] : [],
      ),
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
      isComplete: results.length > 0 && results.every((result) => result.isSuccess),
    }),
  });
}
