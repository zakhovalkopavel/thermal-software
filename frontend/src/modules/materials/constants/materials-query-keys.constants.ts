import type { MaterialGroupRoute } from '../types/material-group-route.type';
import type { MaterialListQuery } from '../types/material-list-query.type';

export const MATERIALS_QUERY_KEYS = {
  metals: ['materials', 'metals'] as const,
  gases: ['materials', 'gases'] as const,
  refractories: ['materials', 'refractories'] as const,
  groups: ['materials', 'groups'] as const,
  group: (route: MaterialGroupRoute) => ['materials', 'group', route] as const,
  mixComponents: ['materials', 'mix-components'] as const,
  categories: ['materials', 'categories'] as const,
  library: (query: MaterialListQuery) => ['materials', 'library', query] as const,
  material: (materialId: string | null | undefined) => ['materials', 'material', materialId] as const,
  particleSizes: ['materials', 'particle-sizes'] as const,
  mixComposition: (input: unknown) => ['materials', 'mix-composition', input] as const,
  thermalConductivity: (input: unknown) => ['materials', 'thermal-conductivity', input] as const,
  refractoryProperties: (material: string, T_K: number) => ['materials', 'refractory-properties', material, T_K] as const,
  metalThermal: (material: string, T_K: number) => ['materials', 'metal-thermal', material, T_K] as const,
  compositionConvert: (composition: unknown, direction: string) =>
    ['materials', 'composition-convert', direction, composition] as const,
  glassViscosity: (input: unknown) => ['materials', 'glass-viscosity', input] as const,
  glassProfile: (input: unknown) => ['materials', 'glass-profile', input] as const,
  glassReferenceProfile: (materialId: string, grid: number[], model: string | null) =>
    ['materials', 'glass-profile', 'reference', materialId, grid, model] as const,
  glassTemperatureAtViscosity: (input: unknown) => ['materials', 'glass-temperature-at-viscosity', input] as const,
  mineral: (endpoint: string, input: unknown) => ['materials', 'mineral', endpoint, input] as const,
};
