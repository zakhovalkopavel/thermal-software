import type { CmsPage } from './page.type';
import type { SiteSettings } from './site-settings.type';

export type PageBootstrap = {
  path: string;
  page: Pick<
    CmsPage,
    'path' | 'kind' | 'title' | 'resume' | 'bodyHtml' | 'seoTitle' | 'seoDescription' | 'published'
  > | null;
  settings: SiteSettings;
};
