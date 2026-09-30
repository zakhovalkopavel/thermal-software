import { mixCompositionApi } from '../../../api/mix-composition.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { toSingleMaterialCompositionRequest } from '../mappers/single-material-composition-request.mapper';

export function singleMaterialCompositionQuery(materialId: string) {
  const input = toSingleMaterialCompositionRequest(materialId);
  return {
    queryKey: MATERIALS_QUERY_KEYS.mixComposition(input),
    queryFn: () => mixCompositionApi.calculate(input),
    staleTime: Infinity,
    retry: false,
  };
}
