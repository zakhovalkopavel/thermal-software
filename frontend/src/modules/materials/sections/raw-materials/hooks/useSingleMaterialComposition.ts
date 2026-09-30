import { useQuery } from '@tanstack/react-query';
import { singleMaterialCompositionQuery } from './single-material-composition.query';

export function useSingleMaterialComposition(materialId: string | null | undefined, enabled = true) {
  return useQuery({
    ...singleMaterialCompositionQuery(materialId ?? ''),
    enabled: Boolean(materialId) && enabled,
  });
}
