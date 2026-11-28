export type PageKind = 'calc' | 'hub' | 'info' | 'standalone';

export type CmsPage = {
  id?: string;
  path: string;
  kind: PageKind;
  title: string;
  resume: string;
  bodyHtml: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalPath?: string | null;
  published: boolean;
  updatedAt?: string;
};
