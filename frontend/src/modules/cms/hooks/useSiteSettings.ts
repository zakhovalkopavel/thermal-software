import { useQuery } from '@tanstack/react-query';
import { fetchPublicSiteSettings } from '../api/cms.api';
import { CMS_QUERY_KEYS } from '../constants/cms-query-keys.constants';
import { PageBootstrapReader } from '../utils/read-page-bootstrap';

export function useSiteSettings() {
  const bootstrap = PageBootstrapReader.read();
  return useQuery({
    queryKey: CMS_QUERY_KEYS.settings,
    queryFn: fetchPublicSiteSettings,
    initialData: bootstrap?.settings,
  });
}
