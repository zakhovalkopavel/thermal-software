import { useQuery } from '@tanstack/react-query';
import { fetchPage } from '../api/cms.api';
import { CMS_QUERY_KEYS } from '../constants/cms-query-keys.constants';
import { PageBootstrapReader } from '../utils/read-page-bootstrap';

export function useCmsPage(path: string) {
  const bootstrap = PageBootstrapReader.read();
  const bootstrapMatch = bootstrap?.path === path ? bootstrap.page : null;

  return useQuery({
    queryKey: CMS_QUERY_KEYS.page(path),
    queryFn: () => fetchPage(path),
    initialData: bootstrapMatch
      ? {
          path: bootstrapMatch.path,
          kind: bootstrapMatch.kind,
          title: bootstrapMatch.title,
          resume: bootstrapMatch.resume,
          bodyHtml: bootstrapMatch.bodyHtml,
          seoTitle: bootstrapMatch.seoTitle,
          seoDescription: bootstrapMatch.seoDescription,
          published: bootstrapMatch.published,
        }
      : undefined,
    retry: false,
  });
}
