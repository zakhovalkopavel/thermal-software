import { useMemo } from 'react';
import { toMaterialPickerOptions } from '../mappers/material-picker-options.mapper';
import type { MaterialGroup } from '../types/material-group.type';
import type { MaterialPickerKind } from '../types/material-picker-kind.type';
import type { MaterialPickerOption } from '../types/material-picker-option.type';
import { useGasList } from './useGasList';
import { useMaterialCategories } from './useMaterialCategories';
import { useMetalList } from './useMetalList';
import { useMixComponents } from './useMixComponents';
import { useRefractoryProducts } from './useRefractoryProducts';

export function useMaterialPickerOptions(kinds: MaterialPickerKind[], categories?: MaterialGroup[]) {
  const metals = useMetalList(kinds.includes('metal'));
  const refractories = useRefractoryProducts(kinds.includes('refractory'));
  const gases = useGasList(kinds.includes('gas'));
  const library = useMaterialCategories(kinds.includes('library'));
  const mixComponents = useMixComponents(kinds.includes('mix-component'));

  const queries = { metal: metals, refractory: refractories, gas: gases, library, 'mix-component': mixComponents };
  const active = kinds.map((kind) => queries[kind]);
  const isLoading = active.some((query) => query.isLoading);
  const error = active.find((query) => query.error)?.error ?? null;

  const options = useMemo<MaterialPickerOption[]>(
    () =>
      kinds.flatMap((kind) => {
        switch (kind) {
          case 'metal':
            return metals.data ? toMaterialPickerOptions({ kind, data: metals.data }) : [];
          case 'refractory':
            return refractories.data ? toMaterialPickerOptions({ kind, data: refractories.data }) : [];
          case 'gas':
            return gases.data ? toMaterialPickerOptions({ kind, data: gases.data }) : [];
          case 'library':
            return library.data ? toMaterialPickerOptions({ kind, data: library.data }, categories) : [];
          case 'mix-component':
            return mixComponents.data ? toMaterialPickerOptions({ kind, data: mixComponents.data }, categories) : [];
        }
      }),
    [kinds, categories, metals.data, refractories.data, gases.data, library.data, mixComponents.data],
  );

  return { options, isLoading, error };
}
