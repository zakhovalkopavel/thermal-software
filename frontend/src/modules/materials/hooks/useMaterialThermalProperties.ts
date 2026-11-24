import { useQuery } from '@tanstack/react-query';
import { refractoryProductsApi } from '../api/refractory-products.api';
import { MATERIALS_QUERY_KEYS } from '../constants/materials-query-keys.constants';
import { metalThermalApi } from '../sections/metals/api/metal-thermal.api';
import type { MaterialPickerSelection } from '../types/material-picker-selection.type';
import type { MaterialThermalProperties } from '../types/material-thermal-properties.type';

/** λ and ε of a metal or refractory at `T_K`; other picker kinds have no thermal endpoint. */
export function useMaterialThermalProperties(selection: MaterialPickerSelection | null, T_K: number | null) {
  const supported = selection !== null && (selection.kind === 'metal' || selection.kind === 'refractory');
  return useQuery({
    queryKey:
      selection?.kind === 'metal'
        ? MATERIALS_QUERY_KEYS.metalThermal(selection.materialId, T_K ?? 0)
        : MATERIALS_QUERY_KEYS.refractoryProperties(selection?.materialId ?? '', T_K ?? 0),
    queryFn: (): Promise<MaterialThermalProperties> => {
      const query = { material: (selection as MaterialPickerSelection).materialId, T_K: T_K as number };
      return selection?.kind === 'metal' ? metalThermalApi.getProperties(query) : refractoryProductsApi.getProperties(query);
    },
    enabled: supported && T_K !== null && T_K > 0,
    staleTime: Infinity,
    retry: false,
  });
}
