import axios from 'axios';
import { api } from '@/shared/api/client';
import type { CmsPage } from '@/modules/cms/types/page.type';
import type { SiteSettings } from '@/modules/cms/types/site-settings.type';
import { ADMIN_STORAGE_KEYS } from '../constants/admin-storage.constants';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function adminLogin(password: string): Promise<string> {
  const { data } = await api.post<{ accessToken: string }>('/admin/auth/login', {
    password,
  });
  return data.accessToken;
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await adminApi.patch('/admin/auth/password', { currentPassword, newPassword });
}

export async function adminListPages(): Promise<CmsPage[]> {
  const { data } = await adminApi.get<CmsPage[]>('/admin/pages');
  return data;
}

export async function adminUpdatePage(
  path: string,
  payload: Partial<CmsPage>,
): Promise<CmsPage> {
  const { data } = await adminApi.patch<CmsPage>('/admin/pages', payload, {
    params: { path },
  });
  return data;
}

export async function adminGetSettings(): Promise<SiteSettings> {
  const { data } = await adminApi.get<SiteSettings>('/admin/site-settings');
  return data;
}

export async function adminUpdateSettings(
  payload: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const { data } = await adminApi.patch<SiteSettings>('/admin/site-settings', payload);
  return data;
}
