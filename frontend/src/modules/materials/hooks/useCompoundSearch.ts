import { useQuery } from '@tanstack/react-query';
import { compoundsApi } from '../api/compounds.api';
import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';

export function useCompoundSearch(q: string, gasesOnly = true, enabled = true) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEYS.compoundSearch, trimmed, gasesOnly],
    queryFn: () =>
      compoundsApi.search({
        q: trimmed,
        limit: COMPOUND_AUTOCOMPLETE.searchLimit,
        gasesOnly,
      }),
    enabled: enabled && trimmed.length > 0,
    staleTime: 60_000,
  });
}
