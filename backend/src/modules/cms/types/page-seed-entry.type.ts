import type { PageKind } from '../enums/page-kind.enum';

export type PageSeedEntry = {
  path: string;
  kind: PageKind;
  title: string;
  resume: string;
  bodyHtml?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalPath?: string | null;
  published?: boolean;
};
