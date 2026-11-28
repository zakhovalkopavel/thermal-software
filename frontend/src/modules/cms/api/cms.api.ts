import { api } from '@/shared/api/client';
import type { CmsPage } from '../types/page.type';
import type { SiteSettings } from '../types/site-settings.type';

export async function fetchPage(path: string): Promise<CmsPage> {
  const { data } = await api.get<CmsPage>('/pages', { params: { path } });
  return data;
}

export async function fetchPagesByPrefix(prefix: string): Promise<CmsPage[]> {
  const { data } = await api.get<CmsPage[]>('/pages/list', { params: { prefix } });
  return data;
}

export async function fetchPublicSiteSettings(): Promise<SiteSettings> {
  const { data } = await api.get<SiteSettings>('/site-settings/public');
  return data;
}
