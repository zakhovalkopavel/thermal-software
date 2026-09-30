import { api } from '../../../services/api/client';
import type { MaterialCategory } from '../types/material-category.type';
import type { MaterialEntry } from '../types/material-entry.type';
import type { MaterialGroupRoute } from '../types/material-group-route.type';
import type { MaterialGroupSummary } from '../types/material-group-summary.type';
import type { MaterialListQuery } from '../types/material-list-query.type';

export const materialLibraryApi = {
  list: async (query: MaterialListQuery): Promise<MaterialEntry[]> =>
    (await api.get<MaterialEntry[]>('/refractory/materials', { params: query })).data,
  get: async (materialId: string): Promise<MaterialEntry> =>
    (await api.get<MaterialEntry>(`/refractory/materials/${encodeURIComponent(materialId)}`)).data,
  listGroups: async (): Promise<MaterialGroupSummary[]> =>
    (await api.get<MaterialGroupSummary[]>('/refractory/material-groups')).data,
  listByGroup: async (route: MaterialGroupRoute): Promise<MaterialEntry[]> =>
    (await api.get<MaterialEntry[]>(`/refractory/${route}`)).data,
  listMixComponents: async (): Promise<MaterialCategory[]> =>
    (await api.get<MaterialCategory[]>('/refractory/mix-components')).data,
  listCategories: async (): Promise<MaterialCategory[]> =>
    (await api.get<MaterialCategory[]>('/refractory/material-categories')).data,
};
