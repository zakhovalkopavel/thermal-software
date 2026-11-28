import { useQuery } from '@tanstack/react-query';
import { fetchPagesByPrefix } from '../api/cms.api';
import { CMS_QUERY_KEYS } from '../constants/cms-query-keys.constants';

export function useCmsPagesPrefix(prefix: string) {
  return useQuery({
    queryKey: CMS_QUERY_KEYS.pagesPrefix(prefix),
    queryFn: () => fetchPagesByPrefix(prefix),
  });
}
