import { MATERIAL_PICKER_GROUP_LABELS } from '../constants/material-picker-group-labels.constants';
import type { MaterialGroup } from '../types/material-group.type';
import type { MaterialPickerOption } from '../types/material-picker-option.type';
import type { MaterialPickerSource } from '../types/material-picker-source.type';
import { toRefractoryGroups } from './refractory-groups.mapper';

export function toMaterialPickerOptions(source: MaterialPickerSource, categories?: MaterialGroup[]): MaterialPickerOption[] {
  switch (source.kind) {
    case 'metal':
      return source.data.map((metal) => ({
        kind: 'metal',
        id: metal.materialId,
        label: metal.name,
        groupLabel: MATERIAL_PICKER_GROUP_LABELS.metal,
        description: metal.description,
      }));
    case 'refractory':
      return toRefractoryGroups(source.data).flatMap((group) =>
        group.products.map((product) => ({
          kind: 'refractory' as const,
          id: product.materialId,
          label: product.name,
          groupLabel: `${MATERIAL_PICKER_GROUP_LABELS.refractory} · ${group.label}`,
          description: product.description,
        })),
      );
    case 'gas':
      return source.data.map((gas) => ({
        kind: 'gas',
        id: gas.key,
        label: gas.formula && gas.formula !== gas.name ? `${gas.name} (${gas.formula})` : gas.name,
        groupLabel: MATERIAL_PICKER_GROUP_LABELS.gas,
      }));
    case 'library':
    case 'mix-component':
      return source.data
        .filter((category) => !categories || categories.includes(category.group))
        .flatMap((category) =>
          category.materials.map((material) => ({
            kind: source.kind,
            id: material.materialId,
            label: material.name,
            groupLabel: category.label,
            description: material.description,
          })),
        );
  }
}
